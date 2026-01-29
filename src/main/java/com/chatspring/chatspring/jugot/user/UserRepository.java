package com.chatspring.chatspring.jugot.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByNickname(String nickname);
    boolean existsByUsername(String username);
    boolean existsByNickname(String nickname);
    boolean existsByRequestedNickname(String requestedNickname);
    java.util.List<User> findByRequestedNicknameIsNotNull();
    java.util.List<User> findByIsApprovedFalse();
}

