import { Request, Response } from "express";
import { Redis } from "ioredis";
import Dataloader from "dataloader";
import { User } from "./entities/User";
import { createUpdootLoader } from "./utils/createUpdootLoader";

export type MyContext = {
  req: Request & { session: any };
  res: Response;
  redis: Redis;
  userLoader: Dataloader<number, User>;
  updootLoader: ReturnType<typeof createUpdootLoader>;
};
