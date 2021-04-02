import { InputType, Field } from "type-graphql";

@InputType()
export class UsernameAndPassword {
  @Field()
  email: string;
  @Field()
  username: string;
  @Field()
  password: string;
}
