import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class FieldError {
  @Field(() => String, { nullable: true })
  field: string;
  @Field(() => String, { nullable: true })
  message: string;
}
