import Dataloader from "dataloader";
import { Updoot } from "../entities/Updoot";

export const createUpdootLoader = () =>
  new Dataloader<{ postId: number; userId: number }, Updoot>(async (keys) => {
    const updoots = await Updoot.findByIds(keys as any);
    const updootsIdstoUpdoot: Record<string, Updoot> = {};
    // mapping updoots ids to its objects
    updoots.forEach((updoot) => {
      updootsIdstoUpdoot[`${updoot.postId}|${updoot.userId}`] = updoot;
    });

    // returning the objects according to the user ids
    return keys.map((key) => updootsIdstoUpdoot[`${key.postId}|${key.userId}`]);
  });
