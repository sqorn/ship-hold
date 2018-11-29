import {
    EntityService,
    RelationArgument,
    SelectServiceBuilder,
    ShipHoldBuilders,
    WithInclusion
} from '../interfaces';
import {normaliseInclude} from './utils';
import {changeFromRelation} from './relations';

type BuilderWithInclude = SelectServiceBuilder & WithInclusion<SelectServiceBuilder>;

export const withInclude = (aliasToService: Map<string, EntityService>, sh: ShipHoldBuilders) => {

    return (target: SelectServiceBuilder): BuilderWithInclude => {

        const include = withInclude(aliasToService, sh);

        const originalBuild = Object.getPrototypeOf(target).build.bind(target);
        const originalClone = Object.getPrototypeOf(target).clone.bind(target);

        return Object.assign(target, {
            inclusions: [],
            include(this: BuilderWithInclude, ...relations: RelationArgument[]) {
                this.inclusions.push(...relations
                    .map(normaliseInclude(aliasToService, target)));
                return this;
            },
            clone(deep = true) {
                const clone = include(<SelectServiceBuilder>originalClone());
                if (deep === true && this.inclusions.length) {
                    clone.include(...this.inclusions.map(({as, builder}) => {
                        const relationClone = <SelectServiceBuilder>builder.clone();
                        return {
                            as,
                            builder: relationClone
                        };
                    }));
                }
                return clone;
            },
            toBuilder(this: BuilderWithInclude) {
                const clone = <BuilderWithInclude>this.clone();
                const fullRelationsList = [{
                    as: target.cte,
                    builder: clone
                }, ...(clone as BuilderWithInclude).inclusions];
                clone.inclusions.splice(0); // empty list
                return include(fullRelationsList.reduce(changeFromRelation(sh), clone));
            },
            build(params, offset) {
                if (this.inclusions.length === 0) {
                    return originalBuild(params, offset);
                }

                return this.toBuilder().build(params, offset);
            }
        });
    };
};
