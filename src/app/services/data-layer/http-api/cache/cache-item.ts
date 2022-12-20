export class CacheItem {
    public data: any;
    public createdAt: Date;

    constructor(data) {
        this.data = data;
        this.createdAt = new Date();
    }
}
