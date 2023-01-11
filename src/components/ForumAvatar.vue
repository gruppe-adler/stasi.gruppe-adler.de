<template>
    <img v-if="picture !== ''" :src="picture" />
    <div v-else :style="`background-color: ${user['icon:bgColor']}`">
        <span>{{ user['icon:text'] }}</span>
    </div>
</template>

<script lang="ts" setup>
import type ForumUser from '@/services/models/ForumUser';
import { FORUM_URI } from '@/services/forum';
import { computed, type PropType } from 'vue';

const props = defineProps({
    user: {
        required: true,
        type: Object as PropType<ForumUser>
    }
});

const picture = computed<string>(() => {
    if (props.user.picture === null) return '';
    if (props.user.picture.startsWith('/')) {
        return `${FORUM_URI}${props.user.picture}`;
    }

    return props.user.picture;
});
</script>

<style lang="scss" scoped>
img,
div {
    width: 1em;
    height: 1em;
    border-radius: 0.5em;
    color: white;
}

div {
    display: flex;
    justify-content: center;
    align-items: center;

    > span {
        font-size: 0.5em;
    }
}
</style>
