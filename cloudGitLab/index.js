'use strict';

const HEADER_KEY = "x-gitlab-event";

const eventHandMap = {
    'Issue Hook': handleIssue,
    'Push Hook': handlePush,
    'Merge Request Hook': handlePR
};

const ChatRobot = require('./chat');

/**
 * 处理push事件
 * @param ctx koa context
 * @param robotid 机器人id
 */
async function handlePush(body, robotid) {
    const robot = new ChatRobot(
        robotid
    );
    let {ref, user_name, project:{name:proName, web_url}, commits} = body;
    // 循环处理 commits
    var commitListString = '';
    for (var i = 0; i < commits.length; i++) {
        commitListString +=(i+1) + ') ' + commits[i].timestamp.substring(0, 19).replace('T',' ') + ' ' + commits[i].title + ' ' + commits[i].author.name + '\n';
    }
    // ref 分支名称 为：refs/heads/XXXXXX 取 XXXXXX 即可
    const brunch = ref.slice(11);
    const commitsDetail = 'http://git-inc.ovopark.com:6780/android/ovopark/-/commits/' + brunch;
    const mdMsg = `项目 [${proName}](${web_url}) 收到一次push提交\n
        >分支： <font color=\"comment\">${brunch}</font>
        >提交者:  <font color=\"comment\">${user_name}</font>
        >提交信息: 共计<font color=\"info\">${commits.length}</font>条\n<font color=\"comment\">${commitListString}</font>
        >[查看详情](${commitsDetail})`;
    await robot.sendMdMsg(mdMsg);
    return mdMsg;
}

/**
 * 处理merge request事件
 * @param ctx koa context
 * @param robotid 机器人id
 */
async function handlePR(body, robotid) {
    const robot = new ChatRobot(
        robotid
    );
    let {object_kind='', user:{name, avatar_url}, project:{name:proName, web_url}, object_attributes:{title, state, target_branch, source_branch, url}} = body;
    const mdMsg = `[${name}](${avatar_url})在 [${proName}](${web_url}) 中${state}了一次${object_kind}\n
        >标题： <font color=\"comment\">${title}</font>
        >源分支： <font color=\"comment\">${source_branch}</font>
        >目标分支： <font color=\"comment\">${target_branch}</font>
        >[查看PR详情](${url})`;
    await robot.sendMdMsg(mdMsg);
    return mdMsg;
}

/**
 * 处理issue 事件
 * @param ctx koa context
 * @param robotid 机器人id
 */
async function handleIssue(body, robotid) {
    const robot = new ChatRobot(
        robotid
    );
    let {user: {name, avatar_url}, project: {name:proName ,web_url}, object_attributes: {title, url, action}} = body;
    const mdMsg = `[${name}](${avatar_url}) 在 [${proName}](${web_url}) 中 ${action} 了一个issue\n
        >标题： <font color=\"comment\">${title}</font>
        >发起人： <font color=\"comment\">[${name}](${avatar_url})</font>
        >[查看详情](${url})`;
    await robot.sendMdMsg(mdMsg);
    return mdMsg;
}

/**
 * 对于未处理的事件，统一走这里
 * @param ctx koa context
 * @param event 事件名
 */
function handleDefault(event) {
    return `Sorry，暂时还没有处理${event}事件`;
}

exports.main_handler = async (event) => {
    const gitEvent = event.headers[HEADER_KEY];
    const robotid = event.queryString.id;
    const bodyObj = JSON.parse(event.body);
    return eventHandMap[gitEvent] ? eventHandMap[gitEvent](bodyObj, robotid) : handleDefault(gitEvent);
};
