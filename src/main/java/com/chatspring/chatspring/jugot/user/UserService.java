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
        // 아이디 검증: 영문 소문자/숫자, 6~20자, 특수문자 불가
        String username = user.getUsername();
        if (username == null || !username.matches("^[a-z0-9]{6,20}$")) {
            throw new RuntimeException("아이디는 영문 소문자와 숫자만 사용 가능하며, 6~20자여야 합니다.");
        }

        // 닉네임 검증: 한글/영문, 최대 10자, 특수문자 불가
        String nickname = user.getNickname();
        if (nickname == null || !nickname.matches("^[가-힣a-zA-Z]{1,10}$")) {
            throw new RuntimeException("닉네임은 한글과 영문만 사용 가능하며, 최대 10자까지 입력 가능합니다.");
        }

        // 비밀번호 검증: 영문/숫자/특수문자 포함, 8~20자
        String password = user.getPassword();
        if (password == null || !password.matches("^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{8,20}$")) {
            throw new RuntimeException("비밀번호는 영문, 숫자, 특수문자(@$!%*#?&)를 포함하여 8~20자여야 합니다.");
        }

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

        // 회원가입 시 승인 대기 상태로 저장
        user.setIsApproved(false);

        return userRepository.save(user);
    }

    public User login(String username, String password) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("아이디 또는 비밀번호가 일치하지 않습니다."));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("아이디 또는 비밀번호가 일치하지 않습니다.");
        }

        // 승인되지 않은 회원은 로그인 불가
        if (Boolean.FALSE.equals(user.getIsApproved())) {
            throw new RuntimeException("관리자의 승인을 기다리는 중입니다.");
        }

        return user;
    }

    public User updateUserInfo(Long userId, UserInfoUpdateDto dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        // 자기소개 링크 업데이트
        if (dto.getIntroductionLink() != null) {
            String introductionLink = dto.getIntroductionLink();
            
            // 1. URL 형식 검증
            if (!introductionLink.matches("^(https?://).*")) {
                throw new RuntimeException("올바른 URL 형식이 아닙니다.");
            }

            // 2. Notion 도메인 검증
            if (!introductionLink.contains("notion.so") && !introductionLink.contains("notion.site")) {
                throw new RuntimeException("Notion 주소만 입력 가능합니다.");
            }
            
            user.setIntroductionLink(introductionLink);
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
        if (!introductionLink.matches("^(https?://).*")) {
            throw new RuntimeException("올바른 URL 형식이 아닙니다.");
        }

        // 2. Notion 도메인 검증 (의도에 따라 선택 사항)
        if (!introductionLink.contains("notion.so") && !introductionLink.contains("notion.site")) {
            throw new RuntimeException("Notion 주소만 입력 가능합니다.");
        }

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
     * 전체 멤버 목록 조회 (관리자용)
     * @return 모든 사용자 목록
     */
    public java.util.List<User> findAllMembers() {
        return userRepository.findAll();
    }

    /**
     * 승인된 멤버 목록만 조회 (관리자용) - isApproved가 false인 회원은 제외
     * @return 승인된 사용자 목록 (isApproved == true 또는 null)
     */
    public java.util.List<User> findApprovedMembers() {
        return userRepository.findAll().stream()
                .filter(user -> !Boolean.FALSE.equals(user.getIsApproved()))
                .collect(java.util.stream.Collectors.toList());
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

    /**
     * 승인 대기 중인 회원 목록 조회 (관리자용)
     * @return isApproved == false 인 회원 목록
     */
    public java.util.List<User> getPendingUsers() {
        return userRepository.findByIsApprovedFalse();
    }

    /**
     * 회원가입 승인 (관리자용)
     * @param userId 승인할 사용자 ID
     * @return 업데이트된 User 객체
     */
    public User approveUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        user.setIsApproved(true);
        return userRepository.save(user);
    }

    /**
     * 회원가입 거절 - 해당 회원 정보 삭제 (관리자용)
     * @param userId 거절할 사용자 ID
     */
    public void rejectUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        userRepository.delete(user);
    }
}

