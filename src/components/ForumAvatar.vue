<template>
    <img
        v-if="picture !== ''"
        :src="picture"
    />
    <div v-else :style="`background-color: ${user['icon:bgColor']}`">
        <span>{{ user['icon:text'] }}</span>
    </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import ForumUser from '@/services/models/ForumUser';
import { FORUM_URI } from '@/services/forum';

@Component
export default class ForumAvatarVue extends Vue {
    @Prop({ required: true, type: Object }) private user!: ForumUser;

    private get picture (): string {
        if (this.user.picture === null) return '';
        if (this.user.picture.startsWith('/')) {
            return `${FORUM_URI}${this.user.picture}`;
        }

        return this.user.picture;
    }
}
</script>

<style lang="scss" scoped>
img, div {
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
