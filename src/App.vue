<template>
    <div v-if="loggedIn === false" style="display: flex; justify-content: center; align-items: center; height: 100%">
        <h1>Bitte im Forum einloggen!</h1>
    </div>
    <div class="grad-home" v-else-if="topics.length > 0">
        <template v-if="user !== null">
            <ForumAvatar :user="user" class="grad-home__avatar" />
            <h3 class="grad-home__username">{{ user.username }}</h3>
            <CategorySelect class="grad-home__categories" :categories="categories" v-model="selectedCids" />
            <AttendanceTable
                class="grad-home__table"
                :uid="user.uid"
                :topics="topics"
                :since="user.joindate"
                :categories="selectedCids"
                :key="tableKey"
            />
        </template>
        <img
            v-else
            src="@/assets/placeholder.svg"
            style="grid-area: table; justify-self: flex-end; align-self: flex-start; margin-right: 10%; max-width: 80%"
        />
        <UserFilter class="grad-home__filter" @select-user="user = $event" />
    </div>
    <div v-else style="display: flex; justify-content: center; align-items: center; height: 100%">
        <h1>Lade...</h1>
    </div>
</template>

<script lang="ts" setup>
import UserFilter from '@/components/UserFilter.vue';
import ForumAvatar from '@/components/ForumAvatar.vue';

import type ForumUser from '@/services/models/ForumUser';
import type ForumTopic from './services/models/ForumTopic';
import { fetchForumUser, checkIfLoggedIn as checkIfLoggedInAPI, fetchEventTopics, fetchAttendance } from '@/services/forum';
import AttendanceTable from './components/AttendanceTable.vue';
import CategorySelect from './components/CategorySelect.vue';
import { ref, watch } from 'vue';

const SEARCH_PARAM_NAME = 'uid';

let didReloadTableInLast100ms = false;

const user = ref<ForumUser | null>(null);
const loggedIn = ref<boolean | null>(null);
const topics = ref<ForumTopic[]>([]);
const categories = ref<Array<{ cid: number | null; name: string }>>([]);
const selectedCids = ref<number[]>([]);

decodeUIDfromSearchParams();
checkIfLoggedIn();
loadTopics();

async function decodeUIDfromSearchParams() {
    const searchParams = new URLSearchParams(window.location.search);

    const uidStr = searchParams.get(SEARCH_PARAM_NAME);
    if (uidStr === null) return;

    const uid = Number.parseInt(window.decodeURIComponent(uidStr), 10);
    if (Number.isNaN(uid)) return updateUrl();

    let u: ForumUser | null;
    try {
        u = await fetchForumUser(uid);
    } catch (err) {
        console.error(err);
        return;
    }

    user.value = u;

    // force search params update
    updateUrl();
}

async function checkIfLoggedIn() {
    loggedIn.value = await checkIfLoggedInAPI();
}

async function loadTopics() {
    const ret = await fetchEventTopics();

    topics.value = ret.topics;
    topics.value.forEach(({ tid }) =>
        fetchAttendance(tid).then(attendance => {
            for (const t of topics.value) {
                if (t.tid === tid) {
                    t.attendance = attendance;
                    reloadTable();
                    return;
                }
            }
        })
    );

    const c: Array<{ cid: number | null; name: string }> = [{ cid: null, name: 'Alles' }];
    ret.categories.forEach((name, cid) => c.push({ name, cid }));
    categories.value = c;
}

function updateUrl() {
    const url = new URL(window.location.href);
    if (user.value === null) {
        url.searchParams.delete(SEARCH_PARAM_NAME);
    } else {
        url.searchParams.set(SEARCH_PARAM_NAME, window.encodeURIComponent(user.value.uid));
    }

    window.history.replaceState({ path: url.toString() }, '', url.toString());
}

watch(user, updateUrl);

const tableKey = ref(0);
function reloadTable() {
    if (!didReloadTableInLast100ms) {
        didReloadTableInLast100ms = true;

        window.setTimeout(() => {
            didReloadTableInLast100ms = false;
            tableKey.value++;
        }, 100);
    }
}
</script>

<style lang="scss">
html,
body {
    margin: 0px;
    padding: 0px;
    font-family: 'Roboto', sans-serif;
    height: 100%;
    font-size: 16px;
    background-color: #f0eeec;
}
h1,
h2,
h3,
h4,
h5,
h6 {
    font-family: 'Roboto', sans-serif;
}
</style>

<style lang="scss" scoped>
.grad-home {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    padding: 2rem;
    display: grid;
    grid-template:
        'avatar username filter' auto
        'category category category' auto
        'table table table' 1fr / auto 1fr auto;
    grid-column-gap: 1rem;
    grid-row-gap: 2rem;
    justify-content: center;
    align-items: center;

    &__avatar {
        grid-area: avatar;
        font-size: 3rem;
    }

    &__username {
        grid-area: username;
        font-size: 2rem;
        margin: 0px;
        font-weight: normal;
        overflow: hidden;
    }

    &__filter {
        grid-area: filter;
        justify-self: flex-end;
    }

    &__categories {
        grid-area: category;
    }

    &__table {
        grid-area: table;
        align-self: flex-start;
        justify-self: center;
    }

    @media (max-width: 600px) {
        grid-template:
            'avatar username filter' auto
            'category category category' auto
            'table table table' 1fr / auto 0px 1fr;
    }
}
</style>
