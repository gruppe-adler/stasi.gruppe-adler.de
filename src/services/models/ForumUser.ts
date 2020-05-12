export default interface ForumUser {
    uid: number,
    username: string;
    joindate: number;
    picture: string|null;
    'icon:text': string;
    'icon:bgColor': string;
}
