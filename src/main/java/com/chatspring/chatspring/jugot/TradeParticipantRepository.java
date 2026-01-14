package com.chatspring.chatspring.jugot;

import com.chatspring.chatspring.jugot.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TradeParticipantRepository extends JpaRepository<TradeParticipant, Long> {
    // 특정 실매매의 참여자 목록 조회
    List<TradeParticipant> findByRealTradeId(Long realTradeId);
    
    // 특정 사용자가 참여한 실매매 목록 조회
    List<TradeParticipant> findByUserId(Long userId);
    
    // 특정 실매매와 사용자로 참여자 조회 (중복 체크용)
    Optional<TradeParticipant> findByRealTradeIdAndUserId(Long realTradeId, Long userId);
    
    // 특정 사용자가 특정 실매매에 참여했는지 확인
    boolean existsByRealTradeIdAndUserId(Long realTradeId, Long userId);
    
    // 특정 사용자의 닉네임으로 참여자 조회
    @Query("SELECT tp FROM TradeParticipant tp WHERE tp.user.nickname = :nickname")
    List<TradeParticipant> findByUserNickname(@Param("nickname") String nickname);
    
    // 특정 실매매 ID와 사용자 닉네임으로 참여자 조회
    @Query("SELECT tp FROM TradeParticipant tp WHERE tp.realTrade.id = :realTradeId AND tp.user.nickname = :nickname")
    Optional<TradeParticipant> findByRealTradeIdAndUserNickname(@Param("realTradeId") Long realTradeId, @Param("nickname") String nickname);
}
