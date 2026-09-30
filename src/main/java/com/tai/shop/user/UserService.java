package com.tai.shop.user;

import com.tai.shop.common.exception.AppException;
import com.tai.shop.common.exception.ErrorCode;
import com.tai.shop.user.dto.UserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;

    @Transactional(readOnly = true)
    public UserResponse getUserProfile(String email) {
        User user = userRepository.findWithRolesByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        return userMapper.toUserResponse(user);
    }
}
