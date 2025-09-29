import { AbilityBuilder, createMongoAbility, ExtractSubjectType, InferSubjects, MongoAbility } from "@casl/ability";
import { BlogPost } from "src/blog/schemas/blogPost.schema";
import { User, UserDocument } from "src/user/schemas/user.schema";
import { Action } from "../actionEnum";
import { Injectable } from "@nestjs/common";
import { UserRole } from "src/user/userRolesEnum";
import { UserPayload } from "src/auth/auth.service";

type Subjects = InferSubjects<typeof BlogPost | typeof User> | 'all';

export type AppAbility = MongoAbility<[Action, Subjects]>;

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: UserPayload) {
    const { can, cannot, build } = new AbilityBuilder(createMongoAbility);

    if (user.role===UserRole.ADMIN) {
      can(Action.Manage, 'all'); // read-write access to everything
    } else {
      can(Action.Read, 'all'); // read-only access to everything
    }

    can(Action.Manage, 'BlogPost', { authorId: user._id });
    cannot(Action.Manage,'Books')

    return build({
      
      detectSubjectType: (item) =>
        item.constructor as ExtractSubjectType<Subjects>,
    });
  }
}
