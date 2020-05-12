<template>
    <div class="grad-user-filter" @keydown.down="updateSelected(1)"  @keydown.up="updateSelected(-1)" @keydown.enter="confirmSelection()">
        <input
            type="text"
            v-model="filterText"
            placeholder="Nutzer suchen..."
        />
        <div>
            <div v-if="suggestions.length === 0" style="pointer-events: none; opacity: 50%; display: flex; justify-content: center;">
                <template v-if="loading">
                    Lade Vorschläge...
                </template>
                <template v-else>
                    Keine Nutzer gefunden
                </template>
            </div>
            <div v-else v-for="(s, i) in suggestions" :key="i" @click="selectUser(s)" :style="i === selectedSuggetion ? 'background-color: #CCCCCC' : ''">
                <ForumAvatar :user="s" style="font-size: 1.5em; margin-right: 0.5em;" />
                <span v-html="resultifyUsername(s.username)"></span>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';
import ForumUser from '../services/models/ForumUser';
import ForumAvatarVue from './ForumAvatar.vue';
import { fetchUserSuggetions } from '../services/forum';

@Component({
    components: {
        ForumAvatar: ForumAvatarVue
    }
})
export default class UserFilterVue extends Vue {
    private filterText = '';
    private controller: AbortController|null = null;
    private loading = false;

    private suggestions: ForumUser[] = [];
    private selectedSuggetion = -1;

    private resultifyUsername (str: string) {
        return str.replace(new RegExp(this.filterText, 'ig'), '<b>$&</b>');
    }

    private created () {
        // TODO
        // this.fetchSuggetions();
    }

    @Watch('filterText')
    private async fetchSuggetions () {
        if (this.controller !== null) {
            this.controller.abort();
        }

        if (this.filterText.length < 2) return;

        this.controller = new AbortController();
        this.loading = true;
        try {
            const s = await fetchUserSuggetions(this.filterText, this.controller);
            this.suggestions = s.slice(0, 10);
            this.updateSelected(0);
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error(err);
                return;
            };
        }
        this.loading = false;
        this.controller = null;
    }

    private selectUser (user: ForumUser) {
        this.$emit('select-user', user);
        this.filterText = '';
        if (document.activeElement) {
            (document.activeElement as HTMLElement).blur();
        }
    }

    private updateSelected (offset: number) {
        const index = Math.min(this.suggestions.length - 1, this.selectedSuggetion + offset);

        this.selectedSuggetion = Math.max(-1, index);
    }

    private confirmSelection () {
        if (this.selectedSuggetion < 0) return;
        if (this.selectedSuggetion > this.suggestions.length - 1) return 0;

        this.selectUser(this.suggestions[this.selectedSuggetion]);
    }
}
</script>

<style lang="scss" scoped>
.grad-user-filter {
    position: relative;
    background-color: #D6D4D3;
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
            padding: .5em .5em;
            line-height: 1.5em;
            font-size: 1em;
            width: 100%;
            cursor: pointer;
            display: flex;

            &:hover {
                background-color: #CCCCCC;
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
