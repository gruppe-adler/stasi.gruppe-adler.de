<template>
    <div class="grad-home" v-if="loggedIn === true">
        <template v-if="user !== null">
            <ForumAvatar :user="user" class="grad-home__avatar" />
            <h3 class="grad-home__username">{{user.username}}</h3>
            <CategorySelect
                class="grad-home__categories"
                :categories="categories"
                v-model="selectedCids"
            />
            <AttendanceTable
                class="grad-home__table"
                :key="tableKey"
                :topics="topics"
                :since="user.joindate"
                :categories="selectedCids"
                :attendance="userAttendance"
            />
        </template>
        <img v-else src="@/assets/placeholder.svg" style="grid-area: table; justify-self: flex-end; align-self: flex-start; margin-right: 10%; max-width: 80%;" />
        <UserFilter
            class="grad-home__filter"
            @select-user="user = $event"
        />
    </div>
    <div v-else-if="loggedIn === false" style="display: flex; justify-content: center; align-items: center; height: 100%;">
        <h1>Bitte im Forum einloggen!</h1>
    </div>
    <div v-else style="display: flex; justify-content: center; align-items: center; height: 100%;">
        <h1>Lade...</h1>
    </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';

import UserFilterVue from '@/components/UserFilter.vue';
import ForumAvatarVue from '@/components/ForumAvatar.vue';

import ForumUser from '@/services/models/ForumUser';
import ForumTopic from './services/models/ForumTopic';
import { fetchForumUser, checkIfLoggedIn, fetchEventTopics, fetchAttendance } from '@/services/forum';
import AttendanceTableVue from './components/AttendanceTable.vue';
import CategorySelectVue from './components/CategorySelect.vue';

const SEARCH_PARAM_NAME = 'uid';

@Component({
    components: {
        UserFilter: UserFilterVue,
        ForumAvatar: ForumAvatarVue,
        AttendanceTable: AttendanceTableVue,
        CategorySelect: CategorySelectVue
    }
})
export default class AppVue extends Vue {
    private user: ForumUser|null = null;
    private loggedIn: boolean|null = null;
    private topics: ForumTopic[] = [];
    private categories: Array<{ cid: number|null; name: string }> = [];
    private attendance: Map<number, Map<number, 0|0.5|1>> = new Map(); // tid -> (uid -> probability)
    private selectedCids: number[] = [];
    private userAttendance: Map<number, 0|0.5|1|-1> = new Map();
    private tableKey = 0;
    private reloadedTable = false;

    private created () {
        this.decodeUIDfromSearchParams();
        this.checkIfLoggedIn();
        this.loadTopics();
    }

    private async decodeUIDfromSearchParams () {
        const searchParams = new URLSearchParams(window.location.search);

        const uidStr = searchParams.get(SEARCH_PARAM_NAME);
        if (uidStr === null) return;

        const uid = Number.parseInt(window.decodeURIComponent(uidStr), 10);
        if (Number.isNaN(uid)) return this.updateUrl();

        let user: ForumUser|null;
        try {
            user = await fetchForumUser(uid);
        } catch (err) {
            // TODO
            console.error(err);
            return;
        }

        this.user = user;

        // force search params update
        this.updateUrl();
    }

    private async checkIfLoggedIn () {
        this.loggedIn = await checkIfLoggedIn();
    }

    private async loadTopics () {
        const ret = await fetchEventTopics();

        this.topics = ret.topics;

        this.loadAttendance();

        const categories: Array<{cid: number|null; name: string }> = [
            { cid: null, name: 'Alles' }
        ];
        ret.categories.forEach((name, cid) => categories.push({ name, cid }));
        this.categories = categories;
    }

    private async loadAttendance () {
        this.topics.forEach(({ tid }) => {
            fetchAttendance(tid).then(map => {
                this.attendance.set(tid, map);

                if (this.user !== null) {
                    const val = map.get(this.user.uid);
                    this.userAttendance.set(tid, val === undefined ? -1 : val);
                    if (!this.reloadedTable) {
                        this.reloadedTable = true;
                        this.tableKey++;
                        window.setTimeout(() => { this.reloadedTable = false; this.tableKey++; }, 500);
                    };
                }
            });
        });
    }

    @Watch('user')
    private updateUrl () {
        const url = new URL(window.location.href);
        if (this.user === null) {
            url.searchParams.delete(SEARCH_PARAM_NAME);
        } else {
            url.searchParams.set(SEARCH_PARAM_NAME, window.encodeURIComponent(this.user.uid));
        }

        window.history.replaceState({ path: url.toString() }, '', url.toString());
    }

    @Watch('user')
    private loadUserAttendance () {
        const m = new Map();

        if (this.user === null) {
            this.userAttendance = m;
            return;
        }

        const id = this.user.uid;

        this.attendance.forEach((att, tid) => {
            const val = att.get(id);

            m.set(tid, val === undefined ? -1 : val);
        });

        this.userAttendance = m;
    }
}
</script>

<style lang="scss">

html, body {
    margin: 0px;
    padding: 0px;
    font-family: 'Roboto', sans-serif;
    height: 100%;
    font-size: 16px;
    background-color: #f0eeec;
}
h1, h2, h3, h4, h5, h6 {
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
        "avatar username filter" auto
        "category category category" auto
        "table table table" 1fr / auto 1fr auto;
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

    @media(max-width: 600px) {
        grid-template:
            "avatar username filter" auto
            "category category category" auto
            "table table table" 1fr / auto 0px 1fr;
    }
}
</style>
