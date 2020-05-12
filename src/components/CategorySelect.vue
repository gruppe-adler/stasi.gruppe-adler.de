<template>
    <div>
        <button
            v-for="c in categories"
            :key="c.cid"
            @click="toogle(c.cid)"
            :style="isSelected(c.cid) ? 'background-color: #333; color: #fff;' : undefined"
        >
            {{c.name}}
        </button>
    </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';

@Component
export default class CategorySelectVue extends Vue {
    @Prop({ default: () => [], type: Array }) private categories!: Array<{ cid: number|null; name: string }>;
    @Prop({ type: Array, required: true }) private value!: number[];

    private toogle (cid: number) {
        if (cid === null) {
            this.$emit('input', []);
        }

        const index = this.value.indexOf(cid);

        if (index === -1) {
            this.value.push(cid);
        } else {
            this.value.splice(index, 1);
        }
    }

    private isSelected (cid: number|null) {
        return cid === null ? this.value.length === 0 : this.value.includes(cid);
    }
}
</script>

<style lang="scss" scoped>

div {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;

    button {
        background-color: #CCC;
        color: black;
        border: none;
        font-size: 0.75rem;
        padding: 0.75em 2em;
        border-radius: 2em;
        outline: none;
        cursor: pointer;
        margin-top: .75em;

        &:not(:last-child) {
            margin-right: .75em;
        }
    }
}
</style>
