import redis from "ioredis";
import "dotenv/config";

const redisClient= new redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
})

redisClient.on("connect", () => {
    console.log("Redis connected successfully")
}   )
redisClient.on("error", (err) => {
    console.log("Redis connection error: ", err)
})

export default redisClient; 