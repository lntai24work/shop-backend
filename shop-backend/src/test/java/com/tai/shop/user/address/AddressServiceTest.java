package com.tai.shop.user.address;

import com.tai.shop.common.exception.AppException;
import com.tai.shop.common.exception.ErrorCode;
import com.tai.shop.user.User;
import com.tai.shop.user.UserRepository;
import com.tai.shop.user.address.dto.AddressRequest;
import com.tai.shop.user.address.dto.AddressResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AddressServiceTest {

    @Mock
    private AddressRepository addressRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AddressMapper addressMapper;

    @InjectMocks
    private AddressService addressService;

    private User sampleUser;
    private Address sampleAddress;
    private AddressResponse sampleResponse;

    @BeforeEach
    void setUp() {
        sampleUser = new User();
        sampleUser.setId(1L);
        sampleUser.setEmail("test@shop.com");
        sampleUser.setFullName("Nguyễn Văn A");

        sampleAddress = new Address(
                sampleUser,
                "Nguyễn Văn A",
                "0987654321",
                "Hà Nội",
                "Cầu Giấy",
                "Dịch Vọng Hậu",
                "Số 123 đường Cầu Giấy",
                true
        );
        sampleAddress.setId(10L);

        sampleResponse = new AddressResponse(
                10L,
                "Nguyễn Văn A",
                "0987654321",
                "Hà Nội",
                "Cầu Giấy",
                "Dịch Vọng Hậu",
                "Số 123 đường Cầu Giấy",
                true,
                null,
                null
        );
    }

    @Test
    @DisplayName("getUserAddresses: should return list of addresses")
    void getUserAddresses_shouldReturnList() {
        when(userRepository.findByEmail("test@shop.com")).thenReturn(Optional.of(sampleUser));
        when(addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(1L)).thenReturn(List.of(sampleAddress));
        when(addressMapper.toResponseList(List.of(sampleAddress))).thenReturn(List.of(sampleResponse));

        List<AddressResponse> result = addressService.getUserAddresses("test@shop.com");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).recipientName()).isEqualTo("Nguyễn Văn A");
    }

    @Test
    @DisplayName("createAddress: first address should automatically be marked as default")
    void createAddress_firstAddress_shouldBeDefault() {
        AddressRequest request = new AddressRequest("Nguyễn Văn A", "0987654321", "Hà Nội", "Cầu Giấy", "Dịch Vọng Hậu", "Số 123", false);

        when(userRepository.findByEmail("test@shop.com")).thenReturn(Optional.of(sampleUser));
        when(addressRepository.existsByUserId(1L)).thenReturn(false);
        when(addressRepository.save(any(Address.class))).thenReturn(sampleAddress);
        when(addressMapper.toResponse(any(Address.class))).thenReturn(sampleResponse);

        AddressResponse result = addressService.createAddress("test@shop.com", request);

        assertThat(result).isNotNull();
        verify(addressRepository).save(any(Address.class));
    }

    @Test
    @DisplayName("createAddress: when creating new default address, old default addresses should be cleared")
    void createAddress_secondAddressWithDefaultTrue_shouldClearExistingDefaults() {
        AddressRequest request = new AddressRequest("Nguyễn Văn B", "0912345678", "Hà Nội", "Ba Đình", "Liễu Giai", "Số 456", true);

        when(userRepository.findByEmail("test@shop.com")).thenReturn(Optional.of(sampleUser));
        when(addressRepository.existsByUserId(1L)).thenReturn(true);
        when(addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(1L)).thenReturn(List.of(sampleAddress));
        when(addressRepository.save(any(Address.class))).thenReturn(sampleAddress);
        when(addressMapper.toResponse(any(Address.class))).thenReturn(sampleResponse);

        AddressResponse result = addressService.createAddress("test@shop.com", request);

        assertThat(result).isNotNull();
        assertThat(sampleAddress.isDefault()).isFalse();
        verify(addressRepository).saveAll(anyList());
        verify(addressRepository).save(any(Address.class));
    }

    @Test
    @DisplayName("updateAddress: should update address details")
    void updateAddress_validRequest_shouldUpdate() {
        AddressRequest request = new AddressRequest("Nguyễn Văn C", "0933333333", "TP HCM", "Quận 1", "Bến Nghé", "Số 789", true);

        when(userRepository.findByEmail("test@shop.com")).thenReturn(Optional.of(sampleUser));
        when(addressRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(sampleAddress));
        when(addressRepository.save(sampleAddress)).thenReturn(sampleAddress);
        when(addressMapper.toResponse(sampleAddress)).thenReturn(sampleResponse);

        AddressResponse result = addressService.updateAddress("test@shop.com", 10L, request);

        assertThat(result).isNotNull();
        assertThat(sampleAddress.getRecipientName()).isEqualTo("Nguyễn Văn C");
        assertThat(sampleAddress.getPhone()).isEqualTo("0933333333");
        verify(addressRepository).save(sampleAddress);
    }

    @Test
    @DisplayName("setDefaultAddress: should set target address as default and others false")
    void setDefaultAddress_validId_shouldUpdateDefault() {
        Address address2 = new Address(sampleUser, "Người Nhận 2", "0911111111", "Hà Nội", "Hoàn Kiếm", "Tràng Tiền", "Số 1", false);
        address2.setId(20L);

        when(userRepository.findByEmail("test@shop.com")).thenReturn(Optional.of(sampleUser));
        when(addressRepository.findByIdAndUserId(20L, 1L)).thenReturn(Optional.of(address2));
        when(addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(1L)).thenReturn(List.of(sampleAddress, address2));
        when(addressMapper.toResponse(address2)).thenReturn(sampleResponse);

        AddressResponse result = addressService.setDefaultAddress("test@shop.com", 20L);

        assertThat(result).isNotNull();
        assertThat(sampleAddress.isDefault()).isFalse();
        assertThat(address2.isDefault()).isTrue();
        verify(addressRepository).saveAll(anyList());
    }

    @Test
    @DisplayName("deleteAddress: when deleting default address, should promote next address to default")
    void deleteAddress_whenWasDefault_shouldPromoteNextAddressToDefault() {
        Address address2 = new Address(sampleUser, "Người Nhận 2", "0911111111", "Hà Nội", "Hoàn Kiếm", "Tràng Tiền", "Số 1", false);
        address2.setId(20L);

        when(userRepository.findByEmail("test@shop.com")).thenReturn(Optional.of(sampleUser));
        when(addressRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(sampleAddress));
        when(addressRepository.findFirstByUserIdAndIdNotOrderByCreatedAtDesc(1L, 10L)).thenReturn(Optional.of(address2));

        addressService.deleteAddress("test@shop.com", 10L);

        assertThat(address2.isDefault()).isTrue();
        verify(addressRepository).delete(sampleAddress);
        verify(addressRepository).save(address2);
    }

    @Test
    @DisplayName("getAddressById: should throw AppException when address not found or not owned by user")
    void getAddressById_notFound_shouldThrowAppException() {
        when(userRepository.findByEmail("test@shop.com")).thenReturn(Optional.of(sampleUser));
        when(addressRepository.findByIdAndUserId(999L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> addressService.getAddressById("test@shop.com", 999L))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ADDRESS_NOT_FOUND);
    }
}
