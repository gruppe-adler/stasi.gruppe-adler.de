import ForumUser from './models/ForumUser';
import ForumTopic from './models/ForumTopic';

export const FORUM_URI = 'https://forum.gruppe-adler.de';

const fetchJSON = async (input: RequestInfo, init: RequestInit = {}) => {
    const response = await fetch(input, init);

    if (!response.ok) throw new Error('Response not ok');

    return await response.json();
};

export async function fetchForumUser (uid: number): Promise<ForumUser|null> {
    return await fetchJSON(`${FORUM_URI}/api/user/uid/${uid}`, { credentials: 'include' }) as ForumUser;
}

export async function fetchUserSuggetions (str: string, controller: AbortController): Promise<ForumUser[]> {
    const { users } = await fetchJSON(`${FORUM_URI}/api/users?term=${window.encodeURIComponent(str)}`, { credentials: 'include', signal: controller.signal }) as {
        matchCount: number;
        pageCount: number;
        users: ForumUser[];
    };

    return users;
}

export async function checkIfLoggedIn (): Promise<boolean> {
    const res = await fetch(`${FORUM_URI}/api/me`, { credentials: 'include' });

    return res.ok;
}

interface PageinationThing {
    page: number;
    active: boolean;
    qs: string;
}

interface TopicsResponse {
    pagination: {
        currentPage: number;
        first: PageinationThing;
        last: PageinationThing;
        next: PageinationThing;
        prev: PageinationThing;
        pageCount: number;
        pages: PageinationThing[];
    };
    topics: Array<Omit<ForumTopic, 'eventDate'>&{ deleted: 1|0; timestamp: number; category: { name: string } }>;
};

const regex = /^\d{4}-\d{2}-\d{2}\s*,(\s*\w+\s*,)?\s*/i;
const ATTENDANCE_PLUGIN_ITNRODUCTION = 1483833600000;

export async function fetchEventTopics (): Promise<{ topics: ForumTopic[]; categories: Map<number, string> }> {
    const topics: ForumTopic[] = [];
    const categories: Map<number, string> = new Map();

    const addTopicsToArray = (res: TopicsResponse) => {
        for (const topic of res.topics) {
            if (topic.timestamp < ATTENDANCE_PLUGIN_ITNRODUCTION) continue;
            if (topic.deleted === 1) {
                console.warn(`Skipping topic ${topic.titleRaw} (ID: ${topic.tid}), because it was deleted`);
                continue;
            };
            if (!regex.test(topic.titleRaw)) {
                console.warn(`Skipping topic ${topic.titleRaw} (ID: ${topic.tid}), because its title did not match the required pattern.`);
                continue;
            };

            categories.set(topic.cid, topic.category.name);

            topics.push({
                titleRaw: topic.titleRaw.replace(regex, ''),
                tid: topic.tid,
                slug: topic.slug,
                eventDate: new Date(topic.titleRaw.substr(0, 10)),
                cid: topic.cid
            });
        }
    };

    const response = await fetchJSON(`${FORUM_URI}/api/tags/event`, { credentials: 'include' }) as TopicsResponse;

    addTopicsToArray(response);

    if (response.pagination.pageCount > 1) {
        const promises: Promise<void>[] = [];

        for (let i = 2; i <= response.pagination.pageCount; i++) {
            const p = fetchJSON(`${FORUM_URI}/api/tags/event?page=${i}`, { credentials: 'include' }).then(addTopicsToArray);
            promises.push(p);
        }

        await Promise.all(promises);
    }

    return {
        topics: topics.sort((a, b) => b.eventDate.getTime() - a.eventDate.getTime()),
        categories
    };
}

/*
    This may seem overcomplicated, but we don't want the hunderts of attendance requests
    blocking other requests for literally minutes on slow networks, because of this we
    limit the number of simultaneous attendance requets to MAX_RUNNING_REQUESTS
*/
type TopicAttendance = Map<number, 0|0.5|1>;
const queue: Array<{
    tid: number;
    resolve: (value?: TopicAttendance | PromiseLike<TopicAttendance> | undefined) => void;
    reject: (reason?: unknown) => void;
}> = [];
let runningRequests = 0;
const MAX_RUNNING_REQUESTS = 5;

async function fetchAttendanceWork () {
    if (runningRequests >= MAX_RUNNING_REQUESTS) return;

    const elem = queue.shift();
    if (elem === undefined) return;

    runningRequests++;

    const { resolve, reject, tid } = elem;

    try {
        const m = new Map();

        const { attendants } = await fetchJSON(`${FORUM_URI}/api/attendance/${tid}`, { credentials: 'include' }) as { attendants: Array<{ uid: number; probability: 0|0.5|1 }> };

        for (const a of attendants) {
            m.set(a.uid, a.probability);
        }

        resolve(m);
    } catch (err) {
        reject(err);
    }

    runningRequests--;
    fetchAttendanceWork();
}

export function fetchAttendance (tid: number): Promise<TopicAttendance> {
    return new Promise<TopicAttendance>((resolve, reject) => {
        queue.push({ resolve, reject, tid });
        fetchAttendanceWork();
    });
}
