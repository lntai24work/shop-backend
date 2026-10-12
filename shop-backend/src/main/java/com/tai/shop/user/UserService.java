package com.tai.shop.user;

import com.tai.shop.common.exception.AppException;
import com.tai.shop.common.exception.ErrorCode;
import com.tai.shop.storage.StorageService;
import com.tai.shop.storage.UploadResult;
import com.tai.shop.user.dto.ChangePasswordRequest;
import com.tai.shop.user.dto.UpdateProfileRequest;
import com.tai.shop.user.dto.UserResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final StorageService storageService;

    @Transactional(readOnly = true)
    public UserResponse getUserProfile(String email) {
        User user = userRepository.findWithRolesByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        return userMapper.toUserResponse(user);
    }

    @Transactional
    public UserResponse updateProfile(String email, UpdateProfileRequest request) {
        log.info("Cập nhật thông tin profile cho user: {}", email);
        User user = userRepository.findWithRolesByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        user.setFullName(request.fullName());
        user.setPhone(request.phone());

        User updatedUser = userRepository.save(user);
        return userMapper.toUserResponse(updatedUser);
    }

    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        log.info("Thực hiện đổi mật khẩu cho user: {}", email);

        if (!request.newPassword().equals(request.confirmPassword())) {
            throw new AppException(ErrorCode.PASSWORDS_DO_NOT_MATCH);
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (!passwordEncoder.matches(request.oldPassword(), user.getPassword())) {
            throw new AppException(ErrorCode.OLD_PASSWORD_INCORRECT);
        }

        if (passwordEncoder.matches(request.newPassword(), user.getPassword())) {
            throw new AppException(ErrorCode.NEW_PASSWORD_SAME_AS_OLD);
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
        log.info("Đổi mật khẩu thành công cho user: {}", email);
    }

    @Transactional
    public UserResponse updateAvatar(String email, MultipartFile file) {
        log.info("Upload avatar cho user: {}", email);
        User user = userRepository.findWithRolesByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        UploadResult uploadResult = storageService.uploadImage(file, "shop/avatars/" + user.getId());
        user.setAvatarUrl(uploadResult.url());

        User updatedUser = userRepository.save(user);
        log.info("Cập nhật avatar thành công cho user: {}", email);
        return userMapper.toUserResponse(updatedUser);
    }
}
