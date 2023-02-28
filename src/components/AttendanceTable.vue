<template>
    <div class="grad-table" :key="uid">
        <template v-for="(l, i) in lines">
            <template v-if="l.type === 'data'">
                <i v-if="l.status === 1" class="grad-table__status material-icons" :key="`status_${i}`" style="color: #66aa66"
                    >check_circle</i
                >
                <i v-else-if="l.status === 0" class="grad-table__status material-icons" :key="`status_${i}`" style="color: #c91106"
                    >cancel</i
                >
                <i v-else-if="l.status === 0.5" class="grad-table__status material-icons" :key="`status_${i}`" style="color: #d18d1f"
                    >help</i
                >
                <i v-else-if="l.status === -1" class="grad-table__status material-icons" :key="`status_${i}`" style="color: lightgrey"
                    >radio_button_unchecked</i
                >
                <i v-else class="grad-table__status material-icons" :key="`status_${i}`" style="color: #ccc">hourglass_empty</i>
                <span class="grad-table__date" :key="`date_${i}`" v-html="formatDate(l.date)"></span>
                <span class="grad-table__title" :key="`title_${i}`">
                    {{ l.title }}
                    <a :key="`link_${i}`" :href="l.link" class="material-icons" target="_blank">link</a>
                </span>
            </template>
            <template v-else>
                <span :key="i" class="grad-table__spacer">{{ l.title }}</span>
            </template>
        </template>
    </div>
</template>

<script lang="ts" setup>
import type ForumTopic from '../services/models/ForumTopic';
import { FORUM_URI } from '../services/forum';
import { ref, watch, type PropType } from 'vue';

// 0 = canceled | 1 = firm_commitment | 0.5 = commitment | -1 = no feedback | null = no data loaded
type Line = { type: 'data'; date: Date; title: string; link: string; status: 0 | 1 | 0.5 | -1 | null };

type SpacerLine = { type: 'spacer'; title: string };

const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

const props = defineProps({
    topics: { default: () => [], type: Array as PropType<ForumTopic[]> },
    since: { default: 0, type: Number },
    categories: { default: () => [], type: Array as PropType<number[]> },
    uid: { required: true, type: Number }
});

const lines = ref<Array<Line | SpacerLine>>([]);

function updateLines() {
    let lastDate: Date | null = null;

    lines.value = props.topics.reduce((acc, cur) => {
        if (props.since < cur.eventDate.getTime() && (props.categories.length === 0 || props.categories.includes(cur.cid))) {
            let status: 0 | 1 | 0.5 | -1 | null = null;

            if (cur.attendance !== undefined) {
                const val = cur.attendance.get(props.uid);
                status = val !== undefined ? val : -1;
            }

            if (lastDate === null || cur.eventDate.getMonth() !== lastDate.getMonth()) {
                lastDate = new Date(cur.eventDate);
                acc.push({
                    type: 'spacer',
                    title: getSpacerText(lastDate)
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
    }, [] as (Line | SpacerLine)[]);
}

updateLines();
watch(() => props.topics, updateLines, { deep: true });
watch(() => props.uid, updateLines);
watch(() => props.since, updateLines);
watch(() => props.categories, updateLines, { deep: true });

function formatDate(d: Date): string {
    const date = `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;

    return [`So, ${date}`, `<b>Mo, ${date}</b>`, `Di, ${date}`, `Mi, ${date}`, `Do, ${date}`, `Fr, ${date}`, `Sa, ${date}`][d.getDay()];
}

function getSpacerText(d: Date): string {
    return `${months[d.getMonth()]} ${d.getFullYear().toString().padStart(4, '0')}`;
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
        opacity: 0.5;
        text-decoration: none;
        transition: opacity 0.1s ease-in-out;

        &:hover {
            opacity: 1;
        }
    }
}
</style>
