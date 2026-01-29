import {
  AbilityBuilder,
  createMongoAbility,
  ExtractSubjectType,
  InferSubjects,
  MongoAbility,
} from '@casl/ability';
import { User } from 'src/database/database.types';
import { Action } from '../actionEnum';
import { Injectable } from '@nestjs/common';
import { UserRole } from 'src/user/userRolesEnum';
import { UserPayload } from 'src/auth/auth.service';

type Subjects = 'User' | 'all';

export type AppAbility = MongoAbility<[Action, Subjects]>;

@Injectable()
export class CaslAbilityFactory {
  createForUser(user:UserPayload) {
    const { can, cannot, build } = new AbilityBuilder(createMongoAbility);

    if (user.role === UserRole.ADMIN) {
      can(Action.Manage, 'all'); // read-write access to everything
    } else {
      can(Action.Read, 'all'); // read-only access to everything
      can(Action.Update, 'User', { id: user.id });
    }

    return build({
      detectSubjectType: (item) => {
        if (typeof item === 'string') {
          return item as ExtractSubjectType<Subjects>;
        }
        return 'User' as ExtractSubjectType<Subjects>;
      },
    });
  }
}
