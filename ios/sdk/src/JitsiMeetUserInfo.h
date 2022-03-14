/*
 * Copyright @ 2019-present 8x8, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#import <Foundation/Foundation.h>

@interface JitsiMeetUserInfo : NSObject

/**
 * User display name.
 */
@property (nonatomic, copy, nullable) NSString *displayName;
/**
 * User email.
 */
@property (nonatomic, copy, nullable) NSString *email;
/**
 * URL for the user avatar.
 */
@property (nonatomic, copy, nullable) NSURL *avatar;
/**
 * MARK - Armakom - User room id to join auth required
 */
@property (nonatomic, copy, nullable) NSString *userRoomId;
/**
 * MARK - Armakom - User room password to join auth required
 */
@property (nonatomic, copy, nullable) NSString *userRoomPassword;
/**
 * MARK - Armakom - jwt token to connect auth required rooms
 */
@property (nonatomic, copy, nullable) NSString *jwt;

- (instancetype _Nullable)initWithDisplayName:(NSString *_Nullable)displayName
                                     andEmail:(NSString *_Nullable)email
                                    andAvatar:(NSURL *_Nullable) avatar
                                    andUserRoomId:(NSString *_Nullable)userRoomId
                                    andUserRoomPassword:(NSString *_Nullable)userRoomPassword
                                    andJwt:(NSString *_Nullable)jwt;

@end
