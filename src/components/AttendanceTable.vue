<template>
    <div class="grad-table">
        <template v-for="(l, i) in lines">
            <template v-if="l.type === 'data'">
                <i v-if="l.status === 1" class="grad-table__status material-icons" :key="`status_${i}`" style="color: #66AA66;">check_circle</i>
                <i v-else-if="l.status === 0" class="grad-table__status material-icons" :key="`status_${i}`" style="color: #c91106;">cancel</i>
                <i v-else-if="l.status === 0.5" class="grad-table__status material-icons" :key="`status_${i}`" style="color: #d18d1f;">help</i>
                <i v-else-if="l.status === -1" class="grad-table__status material-icons" :key="`status_${i}`" style="color: lightgrey;">radio_button_unchecked</i>
                <i v-else class="grad-table__status material-icons" :key="`status_${i}`" style="color: #CCC;">hourglass_empty</i>
                <span class="grad-table__date" :key="`date_${i}`" v-html="formatDate(l.date)"></span>
                <span class="grad-table__title" :key="`title_${i}`">
                    {{l.title}}
                    <a :key="`link_${i}`" :href="l.link" class="material-icons" target="_blank">link</a>
                </span>
            </template>
            <template v-else>
                <span :key="i" class="grad-table__spacer">{{l.title}}</span>
            </template>
        </template>
    </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator';
import ForumTopic from '../services/models/ForumTopic';
import { FORUM_URI } from '../services/forum';

// 0 = canceled | 1 = firm_commitment | 0.5 = commitment | -1 = no feedback | null = no data loaded
type Line = { type: 'data'; date: Date; title: string; link: string; status: 0|1|0.5|-1|null };

type SpacerLine = { type: 'spacer'; title: string };

const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

@Component
export default class AttendanceTableVue extends Vue {
    @Prop({ default: () => [], type: Array }) private topics!: ForumTopic[];
    @Prop({ default: 0, type: Number }) private since!: number;
    @Prop({ default: () => [], type: Array }) private categories!: number[];
    @Prop({ required: true, type: Number }) private uid!: number;

    private lines: (Line|SpacerLine)[] = [];

    private created () {
        this.updateLines();
    }

    @Watch('topics', { deep: true })
    @Watch('uid')
    @Watch('since')
    @Watch('categories', { deep: true })
    private updateLines () {
        let lastDate: Date|null = null;

        this.lines = this.topics.reduce((acc, cur) => {
            if (this.since < cur.eventDate.getTime() && (this.categories.length === 0 || this.categories.includes(cur.cid))) {
                let status: 0|1|0.5|-1|null = null;

                if (cur.attendance !== undefined) {
                    const val = cur.attendance.get(this.uid);
                    status = (val !== undefined) ? val : -1;
                }

                if (lastDate === null || cur.eventDate.getMonth() !== lastDate.getMonth()) {
                    lastDate = new Date(cur.eventDate);
                    acc.push({
                        type: 'spacer',
                        title: this.getSpacerText(lastDate)
                    });
                }

                acc.push({
                    type: 'data',
                    date: cur.eventDate,
                    title: cur.titleRaw,
                    link: `${FORUM_URI}/topic/${cur.slug}`,
                    status
                });
            }

            return acc;
        }, [] as (Line|SpacerLine)[]);
    }

    private formatDate (d: Date): string {
        const date = `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;

        return [
            `So, ${date}`,
            `<b>Mo, ${date}</b>`,
            `Di, ${date}`,
            `Mi, ${date}`,
            `Do, ${date}`,
            `Fr, ${date}`,
            `Sa, ${date}`
        ][d.getDay()];
    };

    private getSpacerText (d: Date): string {
        return `${months[d.getMonth()]} ${d.getFullYear().toString().padStart(4, '0')}`;
    }
}
</script>

<style lang="scss" scoped>
.grad-table {
    display: grid;
    grid-template-columns: [icon] auto [date] auto [title] 1fr;
    grid-column-gap: 1.5rem;
    grid-row-gap: 0.5rem;
    padding-bottom: 4rem;

    > * {
        min-height: 32px;
        display: flex;
        align-items: center;
        overflow: hidden;
    }

    &__title {
        color: rgba(black, 50%);
    }

    &__spacer {
        color: rgba(black, 50%);
        text-transform: uppercase;
        grid-column: 2 / 4;
        margin-top: 1rem;
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
