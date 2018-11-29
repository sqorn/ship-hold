const {iterations, pageSize, breath} = require('../config/bench');
const {Users, Posts, Tags, Comments, sh} = require('../scripts/ship-hold');
const collectorFactory = require('../collector');

const wait = () => new Promise(resolve => {
    setTimeout(() => resolve(), breath);
});

(async function () {
    try {
        let iter = 1;
        const collector = collectorFactory();
        // while (iter <= iterations) {
        const start = Date.now();
        const posts = await Posts
            .select()
            .orderBy('published_at', 'desc')
            .limit(pageSize)
            .include(
                Comments
                    .select()
                    .orderBy('published_at', 'desc')
                    .limit(3)
                    .include(Users),
                Tags.select('tag'),
                Users.select()
            )
            .debug();

        const executionTime = Date.now() - start;
        // collector.collect(executionTime);
        console.log(`executed in ${executionTime}ms`);
        console.log(JSON.stringify(posts));
        // console.table(posts.map(({post_id, user_id, tags, published_at, comments}) => ({
        //     post_id, user_id, comments: JSON.stringify(comments.map(c => ({
        //         comment_id: c.comment_id,
        //         user_id: c.author.user_id
        //     }))),
        //     tags: JSON.stringify(tags.map(t => t.tag))
        // })));
        await wait();
        iter++;
        // }
        // collector.print();
    } catch (e) {
        console.log(e);
    } finally {
        sh.stop();
    }
})();

