export default interface ForumTopic {
    titleRaw: string;
    tid: number;
    slug: string;
    eventDate: Date;
    cid: number;
    attendance?: Map<number, 0|0.5|1>;
}
