package com.tai.shop.user.address;

import com.tai.shop.common.exception.AppException;
import com.tai.shop.common.exception.ErrorCode;
import com.tai.shop.user.User;
import com.tai.shop.user.UserRepository;
import com.tai.shop.user.address.dto.AddressRequest;
import com.tai.shop.user.address.dto.AddressResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AddressService {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;
    private final AddressMapper addressMapper;

    @Transactional(readOnly = true)
    public List<AddressResponse> getUserAddresses(String email) {
        log.debug("Lấy danh sách địa chỉ của user: {}", email);
        User user = getUserByEmail(email);
        List<Address> addresses = addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(user.getId());
        return addressMapper.toResponseList(addresses);
    }

    @Transactional(readOnly = true)
    public AddressResponse getAddressById(String email, Long addressId) {
        log.debug("Lấy chi tiết địa chỉ ID: {} của user: {}", addressId, email);
        User user = getUserByEmail(email);
        Address address = addressRepository.findByIdAndUserId(addressId, user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.ADDRESS_NOT_FOUND));
        return addressMapper.toResponse(address);
    }

    @Transactional
    public AddressResponse createAddress(String email, AddressRequest request) {
        log.info("Tạo địa chỉ mới cho user: {}", email);
        User user = getUserByEmail(email);

        boolean hasExistingAddresses = addressRepository.existsByUserId(user.getId());
        boolean shouldBeDefault = request.isDefault() || !hasExistingAddresses;

        if (shouldBeDefault && hasExistingAddresses) {
            clearOtherDefaultAddresses(user.getId(), null);
        }

        Address address = new Address(
                user,
                request.recipientName(),
                request.phone(),
                request.province(),
                request.district(),
                request.ward(),
                request.detailAddress(),
                shouldBeDefault
        );

        Address savedAddress = addressRepository.save(address);
        log.info("Đã tạo thành công địa chỉ ID: {} cho user: {}", savedAddress.getId(), email);
        return addressMapper.toResponse(savedAddress);
    }

    @Transactional
    public AddressResponse updateAddress(String email, Long addressId, AddressRequest request) {
        log.info("Cập nhật địa chỉ ID: {} của user: {}", addressId, email);
        User user = getUserByEmail(email);

        Address address = addressRepository.findByIdAndUserId(addressId, user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.ADDRESS_NOT_FOUND));

        if (request.isDefault() && !address.isDefault()) {
            clearOtherDefaultAddresses(user.getId(), addressId);
            address.setDefault(true);
        }

        address.setRecipientName(request.recipientName());
        address.setPhone(request.phone());
        address.setProvince(request.province());
        address.setDistrict(request.district());
        address.setWard(request.ward());
        address.setDetailAddress(request.detailAddress());

        Address updatedAddress = addressRepository.save(address);
        return addressMapper.toResponse(updatedAddress);
    }

    @Transactional
    public AddressResponse setDefaultAddress(String email, Long addressId) {
        log.info("Đặt địa chỉ ID: {} làm mặc định cho user: {}", addressId, email);
        User user = getUserByEmail(email);

        Address targetAddress = addressRepository.findByIdAndUserId(addressId, user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.ADDRESS_NOT_FOUND));

        List<Address> addresses = addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(user.getId());
        for (Address addr : addresses) {
            addr.setDefault(addr.getId().equals(addressId));
        }

        addressRepository.saveAll(addresses);
        return addressMapper.toResponse(targetAddress);
    }

    @Transactional
    public void deleteAddress(String email, Long addressId) {
        log.info("Xóa địa chỉ ID: {} của user: {}", addressId, email);
        User user = getUserByEmail(email);

        Address address = addressRepository.findByIdAndUserId(addressId, user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.ADDRESS_NOT_FOUND));

        boolean wasDefault = address.isDefault();
        addressRepository.delete(address);

        if (wasDefault) {
            Optional<Address> nextDefault = addressRepository.findFirstByUserIdAndIdNotOrderByCreatedAtDesc(user.getId(), addressId);
            if (nextDefault.isPresent()) {
                Address newDefault = nextDefault.get();
                newDefault.setDefault(true);
                addressRepository.save(newDefault);
            }
        }

        log.info("Đã xóa địa chỉ ID: {} thành công", addressId);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private void clearOtherDefaultAddresses(Long userId, Long excludeAddressId) {
        List<Address> addresses = addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(userId);
        for (Address addr : addresses) {
            if (excludeAddressId == null || !addr.getId().equals(excludeAddressId)) {
                addr.setDefault(false);
            }
        }
        addressRepository.saveAll(addresses);
    }
}
