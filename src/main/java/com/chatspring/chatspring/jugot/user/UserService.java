package com.chatspring.chatspring.jugot.user;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    public User register(User user) {
        // 아이디 중복 체크
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new RuntimeException("이미 존재하는 아이디입니다.");
        }

        // 닉네임 중복 체크
        if (userRepository.existsByNickname(user.getNickname())) {
            throw new RuntimeException("이미 존재하는 닉네임입니다.");
        }

        // 비밀번호 암호화
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        
        // 권한이 설정되지 않았으면 기본값 설정
        if (user.getRole() == null || user.getRole().isEmpty()) {
            user.setRole("USER");
        }
        
        return userRepository.save(user);
    }

    public User login(String username, String password) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("아이디 또는 비밀번호가 일치하지 않습니다."));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("아이디 또는 비밀번호가 일치하지 않습니다.");
        }

        return user;
    }

    public User updateUserInfo(Long userId, UserInfoUpdateDto dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        // 자기소개 링크 업데이트
        if (dto.getIntroductionLink() != null) {
            user.setIntroductionLink(dto.getIntroductionLink());
        }

        // 닉네임 변경 요청 처리
        if (dto.getRequestedNickname() != null && !dto.getRequestedNickname().isEmpty()) {
            // 요청한 닉네임이 현재 닉네임과 다른 경우에만 처리
            if (!dto.getRequestedNickname().equals(user.getNickname())) {
                // 요청한 닉네임이 이미 사용 중인지 확인 (현재 닉네임과 다른 경우)
                if (userRepository.existsByNickname(dto.getRequestedNickname())) {
                    throw new RuntimeException("이미 사용 중인 닉네임입니다.");
                }
                // requestedNickname도 중복 체크 (다른 사용자가 이미 요청한 경우)
                if (userRepository.existsByRequestedNickname(dto.getRequestedNickname())) {
                    throw new RuntimeException("이미 요청된 닉네임입니다. 관리자 승인 대기 중입니다.");
                }
                user.setRequestedNickname(dto.getRequestedNickname());
            }
        }

        return userRepository.save(user);
    }

    public User findById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
    }

    public User changePassword(Long userId, String currentPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        // 현재 비밀번호 확인
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new RuntimeException("현재 비밀번호가 일치하지 않습니다.");
        }

        // 새 비밀번호 암호화 및 업데이트
        user.setPassword(passwordEncoder.encode(newPassword));
        
        return userRepository.save(user);
    }

    public User updateIntroductionLink(Long userId, String introductionLink) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        user.setIntroductionLink(introductionLink);
        
        return userRepository.save(user);
    }

    /**
     * 닉네임 변경 신청
     * @param userId 사용자 ID
     * @param requestedNickname 변경 요청한 닉네임
     * @return 업데이트된 User 객체
     */
    public User requestNicknameChange(Long userId, String requestedNickname) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        // 요청한 닉네임이 현재 닉네임과 같은 경우
        if (requestedNickname.equals(user.getNickname())) {
            throw new RuntimeException("현재 닉네임과 동일합니다.");
        }

        // 요청한 닉네임이 이미 사용 중인지 확인
        if (userRepository.existsByNickname(requestedNickname)) {
            throw new RuntimeException("이미 사용 중인 닉네임입니다.");
        }

        // 다른 사용자가 이미 요청한 닉네임인지 확인
        if (userRepository.existsByRequestedNickname(requestedNickname)) {
            throw new RuntimeException("이미 요청된 닉네임입니다. 관리자 승인 대기 중입니다.");
        }

        user.setRequestedNickname(requestedNickname);
        return userRepository.save(user);
    }

    /**
     * 닉네임 변경 요청 목록 조회 (관리자용)
     * @return requestedNickname이 null이 아닌 모든 사용자 목록
     */
    public java.util.List<User> findUsersWithNicknameRequests() {
        return userRepository.findByRequestedNicknameIsNotNull();
    }

    /**
     * 닉네임 변경 요청 승인 (관리자용)
     * @param userId 승인할 사용자 ID
     * @return 업데이트된 User 객체
     */
    public User approveNicknameChange(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        if (user.getRequestedNickname() == null || user.getRequestedNickname().isEmpty()) {
            throw new RuntimeException("닉네임 변경 요청이 없습니다.");
        }

        // requestedNickname을 nickname으로 변경
        user.setNickname(user.getRequestedNickname());
        // requestedNickname을 null로 초기화
        user.setRequestedNickname(null);

        return userRepository.save(user);
    }

    /**
     * 닉네임 변경 요청 거절 (관리자용)
     * @param userId 거절할 사용자 ID
     * @return 업데이트된 User 객체
     */
    public User rejectNicknameChange(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        if (user.getRequestedNickname() == null || user.getRequestedNickname().isEmpty()) {
            throw new RuntimeException("닉네임 변경 요청이 없습니다.");
        }

        // requestedNickname만 null로 초기화
        user.setRequestedNickname(null);

        return userRepository.save(user);
    }
}

