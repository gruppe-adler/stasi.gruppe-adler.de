<template>
    <div class="grad-table">
        <template v-for="(l, i) in lines">
            <i v-if="l.status === 1" class="grad-table__status material-icons" :key="`status_${i}`" style="color: #66AA66;">check_circle</i>
            <i v-else-if="l.status === 0" class="grad-table__status material-icons" :key="`status_${i}`" style="color: #c91106;">cancel</i>
            <i v-else-if="l.status === 0.5" class="grad-table__status material-icons" :key="`status_${i}`" style="color: #d18d1f;">help</i>
            <i v-else-if="l.status === -1" class="grad-table__status material-icons" :key="`status_${i}`" style="color: lightgrey;">radio_button_unchecked</i>
            <i v-else class="grad-table__status material-icons" :key="`status_${i}`" style="color: #CCC;">hourglass_empty</i>
            <span class="grad-table__date" :key="`date_${i}`">{{l.date}}</span>
            <span class="grad-table__weekday" :key="`weekday_${i}`" v-html="l.weekday"></span>
            <span class="grad-table__title" :key="`title_${i}`">
                {{l.title}}
                <a :key="`link_${i}`" :href="l.link" class="material-icons">link</a>
            </span>
        </template>
    </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator';
import ForumTopic from '../services/models/ForumTopic';
import { FORUM_URI } from '../services/forum';

// 0 = canceled | 1 = firm_commitment | 0.5 = commitment | -1 = no feedback | null = no data loaded
type Line = { date: string; weekday: string; title: string; link: string; status: 0|1|0.5|-1|null };

@Component
export default class AttendanceTableVue extends Vue {
    @Prop({ default: () => [], type: Array }) private topics!: ForumTopic[];
    @Prop({ default: 0, type: Number }) private since!: number;
    @Prop({ default: () => [], type: Array }) private categories!: number[];
    @Prop({ required: true, type: Number }) private uid!: number;

    private lines: Line[] = [];

    private created () {
        this.updateLines();
    }

    @Watch('topics', { deep: true })
    @Watch('uid')
    @Watch('since')
    @Watch('categories')
    private updateLines () {
        this.lines = this.topics.reduce((acc, cur) => {
            if (this.since < cur.eventDate.getTime() && (this.categories.length === 0 || this.categories.includes(cur.cid))) {
                let status: 0|1|0.5|-1|null = null;

                if (cur.attendance !== undefined) {
                    const val = cur.attendance.get(this.uid);
                    status = (val !== undefined) ? val : -1;
                }

                acc.push({
                    date: cur.eventDate.toISOString().substr(0, 10),
                    weekday: ['So', '<b>Mo</b>', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][cur.eventDate.getDay()],
                    title: cur.titleRaw,
                    link: `${FORUM_URI}/topic/${cur.slug}`,
                    status
                });
            }

            return acc;
        }, [] as Line[]);
    }
}
</script>

<style lang="scss" scoped>
.grad-table {
    display: grid;
    grid-template-columns: [icon] auto [date] auto [weekday] auto [title] 1fr;
    grid-column-gap: 2rem;
    grid-row-gap: 0.5rem;
    padding-bottom: 4rem;

    > * {
        height: 32px;
        display: flex;
        align-items: center;
    }

    &__title {
        color: rgba(black, 50%);
    }

    a {
        margin-left: 0.5rem;
        color: #d18d1f;
        opacity: 50%;
        text-decoration: none;
        transition: opacity 0.1s ease-in-out;

        &:hover {
            opacity: 100%;
        }
    }
}
</style>
