import { ObjectType } from "type-graphql";
import { Entity, BaseEntity, ManyToOne, PrimaryColumn, Column } from "typeorm";
import { User } from "./User";
import { Post } from "./Post";

@ObjectType()
@Entity()
export class Updoot extends BaseEntity {
  @Column({ type: "int" })
  value: number;

  @PrimaryColumn()
  userId: number;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  user: User;

  @PrimaryColumn()
  postId: number;

  @ManyToOne(() => Post, { onDelete: "CASCADE" })
  post: Post;
}
