<template>
    <div>
        <template v-for="c in categories">
            <button
                v-if="c.cid !== null"
                :key="c.cid"
                @click="toogle(c.cid ?? 0)"
                :style="isSelected(c.cid) ? 'background-color: #333; color: #fff;' : undefined"
            >
                {{ c.name }}
            </button>
        </template>
    </div>
</template>

<script lang="ts" setup>
import { computed, type PropType } from 'vue';

const props = defineProps({
    categories: {
        default: () => [],
        type: Array as PropType<Array<{ cid: number | null; name: string }>>
    },
    modelValue: {
        type: Array as PropType<number[]>,
        required: true
    }
});

const value = computed<number[]>({
    get() {
        return props.modelValue;
    },
    set(val) {
        emit('update:modelValue', val);
    }
});

const emit = defineEmits(['update:modelValue']);

function toogle(cid: number) {
    if (cid === null) {
        value.value = [];
    }

    const index = value.value.indexOf(cid);

    if (index === -1) {
        value.value.push(cid);
    } else {
        value.value.splice(index, 1);
    }
}

function isSelected(cid: number | null) {
    return cid === null ? value.value.length === 0 : value.value.includes(cid);
}
</script>

<style lang="scss" scoped>
div {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;

    button {
        background-color: #ccc;
        color: black;
        border: none;
        font-size: 0.75rem;
        padding: 0.75em 2em;
        border-radius: 2em;
        outline: none;
        cursor: pointer;
        margin-top: 0.75em;

        &:not(:last-child) {
            margin-right: 0.75em;
        }
    }
}
</style>
