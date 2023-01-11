<template>
    <div class="grad-user-filter" @keydown.down="updateSelected(1)" @keydown.up="updateSelected(-1)" @keydown.enter="confirmSelection()">
        <input type="text" v-model="filterText" placeholder="Nutzer suchen..." />
        <div>
            <div v-if="suggestions.length === 0" style="pointer-events: none; opacity: 0.5; display: flex; justify-content: center">
                <template v-if="loading"> Lade Vorschläge... </template>
                <template v-else> Keine Nutzer gefunden </template>
            </div>
            <div
                v-else
                v-for="(s, i) in suggestions"
                :key="i"
                @click="selectUser(s)"
                :style="i === selectedSuggetion ? 'background-color: #CCCCCC' : ''"
            >
                <ForumAvatar :user="s" style="font-size: 1.5em; margin-right: 0.5em" />
                <span v-html="resultifyUsername(s.username)"></span>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import type ForumUser from '../services/models/ForumUser';
import ForumAvatar from './ForumAvatar.vue';
import { fetchUserSuggetions } from '../services/forum';
import { ref, watch } from 'vue';

const filterText = ref('');
const controller = ref<AbortController | null>(null);
const loading = ref(false);
const suggestions = ref<ForumUser[]>([]);
const selectedSuggetion = ref(-1);

const emit = defineEmits<{
    (event: 'select-user', user: ForumUser): void;
}>();

function resultifyUsername(str: string) {
    return str.replace(new RegExp(filterText.value, 'ig'), '<b>$&</b>');
}

async function fetchSuggetions() {
    if (controller.value !== null) {
        controller.value.abort();
    }

    if (filterText.value.length < 2) return;

    controller.value = new AbortController();
    loading.value = true;
    try {
        suggestions.value = [];
        const s = await fetchUserSuggetions(filterText.value, controller.value);
        suggestions.value = s.slice(0, 10);
        updateSelected(0);
    } catch (err) {
        if (!(err instanceof DOMException) || err.name !== 'AbortError') {
            console.error(err);
        }
        return;
    }
    loading.value = false;
    controller.value = null;
}

watch(filterText, fetchSuggetions);

function selectUser(user: ForumUser) {
    emit('select-user', user);
    filterText.value = '';
    if (document.activeElement) {
        (document.activeElement as HTMLElement).blur();
    }
}

function updateSelected(offset: number) {
    const index = Math.min(suggestions.value.length - 1, selectedSuggetion.value + offset);

    selectedSuggetion.value = Math.max(-1, index);
}

function confirmSelection() {
    if (selectedSuggetion.value < 0) return;
    if (selectedSuggetion.value > suggestions.value.length - 1) return 0;

    selectUser(suggestions.value[selectedSuggetion.value]);
}
</script>

<style lang="scss" scoped>
.grad-user-filter {
    position: relative;
    background-color: #d6d4d3;
    border-radius: 1.5em;

    > input {
        border: none;
        font-size: 1em;
        padding: 1rem 1.5rem;
        border-radius: inherit;
        width: 16em;
        outline: none;
        background-color: inherit;
    }

    > div {
        display: none;
        position: absolute;
        top: 100%;
        left: 0px;
        right: 0px;
        padding-bottom: 1em;
        border-top: 1px solid #888888;
        background-color: inherit;
        border-bottom-left-radius: inherit;
        border-bottom-right-radius: inherit;
        overflow: hidden;
        flex-direction: column;

        &:hover {
            display: flex;
        }

        // row
        > div {
            padding: 0.5em 0.5em;
            line-height: 1.5em;
            font-size: 1em;
            width: 100%;
            cursor: pointer;
            display: flex;

            &:hover {
                background-color: #cccccc;
            }
        }
    }

    &:focus-within {
        > input {
            border-bottom-left-radius: 0px;
            border-bottom-right-radius: 0px;
        }

        > div {
            display: flex;
        }
    }
}
</style>
