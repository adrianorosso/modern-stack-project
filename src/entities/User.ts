import { ObjectType, Field } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@ObjectType()
@Entity()
export class User extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @CreateDateColumn()
  createdAt: Date = new Date();

  @Field()
  @UpdateDateColumn()
  updatedAt: Date = new Date();

  @Field()
  @Column({ unique: true })
  username!: string;

  @Field()
  @Column()
  password!: string;

  @Field()
  @Column({ unique: true })
  email!: string;
}
