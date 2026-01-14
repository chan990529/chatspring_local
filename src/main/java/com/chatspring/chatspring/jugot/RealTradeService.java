package com.chatspring.chatspring.jugot;

import com.chatspring.chatspring.jugot.user.User;
import com.chatspring.chatspring.jugot.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.HashMap;
import java.util.HashSet;

@Service
public class RealTradeService {

    private final RealTradeRepository repository;
    private final TradeParticipantRepository participantRepository;
    private final UserRepository userRepository;
    private final JugotRepository jugotRepository;

    public RealTradeService(RealTradeRepository repository, 
                           TradeParticipantRepository participantRepository,
                           UserRepository userRepository,
                           JugotRepository jugotRepository) {
        this.repository = repository;
        this.participantRepository = participantRepository;
        this.userRepository = userRepository;
        this.jugotRepository = jugotRepository;
    }

    // 실매매 정보 저장
    public RealTrade createRealTrade(RealTrade realTrade) {
        return repository.save(realTrade);
    }

    // ACTIVE 및 PAUSED 상태인 실매매 목록 조회 (일반 사용자용)
    public List<RealTrade> getActiveRealTrades() {
        List<RealTrade> allTrades = repository.findAllWithParticipants();
        // ACTIVE와 PAUSED 상태만 필터링하여 반환 (COMPLETED 제외)
        return allTrades.stream()
                .filter(trade -> "ACTIVE".equals(trade.getStatus()) || "PAUSED".equals(trade.getStatus()))
                .sorted((a, b) -> {
                    // ACTIVE가 먼저 오도록, 그 다음 생성일 내림차순
                    if (a.getStatus().equals("ACTIVE") && !b.getStatus().equals("ACTIVE")) {
                        return -1;
                    }
                    if (!a.getStatus().equals("ACTIVE") && b.getStatus().equals("ACTIVE")) {
                        return 1;
                    }
                    // 같은 상태면 생성일 내림차순
                    if (a.getCreatedAt() != null && b.getCreatedAt() != null) {
                        return b.getCreatedAt().compareTo(a.getCreatedAt());
                    }
                    return 0;
                })
                .collect(Collectors.toList());
    }

    // 모든 상태의 실매매 목록 조회 (ACTIVE, PAUSED, COMPLETED 포함)
    public List<RealTrade> getAllRealTrades() {
        List<RealTrade> allTrades = repository.findAllWithParticipants();
        // 모든 상태를 반환하되, 정렬은 ACTIVE > PAUSED > 기타 순으로
        return allTrades.stream()
                .sorted((a, b) -> {
                    // ACTIVE가 먼저 오도록
                    if (a.getStatus().equals("ACTIVE") && !b.getStatus().equals("ACTIVE")) {
                        return -1;
                    }
                    if (!a.getStatus().equals("ACTIVE") && b.getStatus().equals("ACTIVE")) {
                        return 1;
                    }
                    // PAUSED가 그 다음
                    if (a.getStatus().equals("PAUSED") && !b.getStatus().equals("PAUSED")) {
                        return -1;
                    }
                    if (!a.getStatus().equals("PAUSED") && b.getStatus().equals("PAUSED")) {
                        return 1;
                    }
                    // 같은 상태면 생성일 내림차순
                    if (a.getCreatedAt() != null && b.getCreatedAt() != null) {
                        return b.getCreatedAt().compareTo(a.getCreatedAt());
                    }
                    return 0;
                })
                .collect(Collectors.toList());
    }

    // ID로 실매매 조회 (참여자 정보 포함)
    public RealTrade findById(Long id) {
        return repository.findByIdWithParticipants(id)
                .orElseThrow(() -> new RuntimeException("실매매 정보를 찾을 수 없습니다."));
    }

    // 참여자 추가
    @Transactional
    public RealTrade addJoinMember(Long id, String nickname) {
        RealTrade realTrade = findById(id);
        
        // 닉네임으로 사용자 조회
        User user = userRepository.findByNickname(nickname)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다: " + nickname));
        
        // 이미 참여한 경우 중복 방지
        if (participantRepository.existsByRealTradeIdAndUserId(id, user.getId())) {
            return realTrade;
        }
        
        // 편의 메서드를 사용하여 참여자 추가
        realTrade.addParticipant(user);
        return repository.save(realTrade);
    }

    // 참여자 제거 (나가기)
    @Transactional
    public RealTrade removeJoinMember(Long id, String nickname) {
        RealTrade realTrade = findById(id);
        
        // 닉네임으로 사용자 조회
        User user = userRepository.findByNickname(nickname)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다: " + nickname));
        
        // 참여자 엔티티 조회 및 제거
        TradeParticipant participant = participantRepository
                .findByRealTradeIdAndUserId(id, user.getId())
                .orElse(null);
        
        if (participant != null) {
            realTrade.getParticipants().remove(participant);
            repository.save(realTrade);
        }
        
        return realTrade;
    }

    // 실매매 삭제
    public void deleteRealTrade(Long id) {
        RealTrade realTrade = findById(id);
        repository.delete(realTrade);
    }

    // 실매매 완료 처리
    public RealTrade completeRealTrade(Long id) {
        RealTrade realTrade = findById(id);
        LocalDate today = LocalDate.now();
        
        // 완료 날짜 저장
        realTrade.setEndDate(today);
        
        // 최종 수익률 계산: (현재가격 - 평단가) / 평단가 * 100
        if (realTrade.getCurrentPrice() != null && realTrade.getAveragePrice() != null && realTrade.getAveragePrice() > 0) {
            double returnRate = ((double)(realTrade.getCurrentPrice() - realTrade.getAveragePrice()) / realTrade.getAveragePrice()) * 100;
            realTrade.setFinalReturnRate(returnRate);
        }
        
        // 최종 경과기간 계산: 시작일로부터 오늘까지의 일수
        if (realTrade.getStartDate() != null) {
            long daysElapsed = ChronoUnit.DAYS.between(realTrade.getStartDate(), today);
            realTrade.setFinalPeriod((int) daysElapsed);
        }
        
        realTrade.setStatus("COMPLETED");
        return repository.save(realTrade);
    }

    // 실매매 중단 처리
    public RealTrade pauseRealTrade(Long id) {
        RealTrade realTrade = findById(id);
        realTrade.setStatus("PAUSED");
        return repository.save(realTrade);
    }

    // 실매매 재개 처리
    public RealTrade resumeRealTrade(Long id) {
        RealTrade realTrade = findById(id);
        realTrade.setStatus("ACTIVE");
        return repository.save(realTrade);
    }

    // 관리자용 실매매 목록 조회 (ACTIVE + PAUSED)
    public List<RealTrade> getRealTradesForAdmin() {
        List<RealTrade> allTrades = repository.findAllWithParticipants();
        // ACTIVE와 PAUSED 상태만 필터링하여 반환 (COMPLETED 제외)
        return allTrades.stream()
                .filter(trade -> "ACTIVE".equals(trade.getStatus()) || "PAUSED".equals(trade.getStatus()))
                .sorted((a, b) -> {
                    // ACTIVE가 먼저 오도록, 그 다음 생성일 내림차순
                    if (a.getStatus().equals("ACTIVE") && !b.getStatus().equals("ACTIVE")) {
                        return -1;
                    }
                    if (!a.getStatus().equals("ACTIVE") && b.getStatus().equals("ACTIVE")) {
                        return 1;
                    }
                    // 같은 상태면 생성일 내림차순
                    if (a.getCreatedAt() != null && b.getCreatedAt() != null) {
                        return b.getCreatedAt().compareTo(a.getCreatedAt());
                    }
                    return 0;
                })
                .collect(Collectors.toList());
    }

    // [변경 시작] Personal Trade 기능: 모든 참여자 목록 조회 (중복 제거, 참여 건수 포함)
    public List<ParticipantSummaryDto> getAllRealTradeParticipants() {
        // 모든 참여자 조회 (JPA 조인 사용)
        List<TradeParticipant> allParticipants = participantRepository.findAll();
        
        // 참여자 이름을 Set으로 수집 (중복 제거)
        Set<String> participantNames = new HashSet<>();
        Map<String, Integer> activeCountMap = new HashMap<>();
        Map<String, Integer> totalCountMap = new HashMap<>();
        
        // 모든 참여자를 순회하며 카운트
        for (TradeParticipant participant : allParticipants) {
            String nickname = participant.getUser().getNickname();
            participantNames.add(nickname);
            
            // 전체 참여 건수 카운트
            totalCountMap.put(nickname, totalCountMap.getOrDefault(nickname, 0) + 1);
            
            // ACTIVE 상태인 실매매에서만 참여자 카운트
            if ("ACTIVE".equals(participant.getRealTrade().getStatus())) {
                activeCountMap.put(nickname, activeCountMap.getOrDefault(nickname, 0) + 1);
            }
        }
        
        // DTO 리스트 생성
        return participantNames.stream()
                .map(name -> new ParticipantSummaryDto(
                        name,
                        activeCountMap.getOrDefault(name, 0),
                        totalCountMap.getOrDefault(name, 0)
                ))
                .sorted((a, b) -> {
                    // 진행중 건수 내림차순, 같으면 이름 오름차순
                    int activeCompare = Integer.compare(b.getActiveCount(), a.getActiveCount());
                    if (activeCompare != 0) return activeCompare;
                    return a.getName().compareTo(b.getName());
                })
                .collect(Collectors.toList());
    }

    // [변경 시작] Personal Trade 기능: 특정 참여자가 참여 중인 실매매 목록 조회
    public List<RealTrade> getActiveRealTradesByParticipant(String participantName) {
        if (participantName == null || participantName.trim().isEmpty()) {
            return new java.util.ArrayList<>();
        }
        
        // JPA 조인을 사용하여 참여자 목록 조회
        List<TradeParticipant> participants = participantRepository.findByUserNickname(participantName.trim());
        
        // ACTIVE 상태인 실매매만 필터링
        return participants.stream()
                .map(TradeParticipant::getRealTrade)
                .filter(trade -> "ACTIVE".equals(trade.getStatus()))
                .sorted((a, b) -> {
                    // 생성일 내림차순
                    if (a.getCreatedAt() != null && b.getCreatedAt() != null) {
                        return b.getCreatedAt().compareTo(a.getCreatedAt());
                    }
                    return 0;
                })
                .collect(Collectors.toList());
    }

    // [변경 시작] Personal Trade 기능: 특정 참여자가 참여한 모든 실매매 목록 조회 (ACTIVE + COMPLETED)
    public List<RealTrade> getAllRealTradesByParticipant(String participantName) {
        if (participantName == null || participantName.trim().isEmpty()) {
            return new java.util.ArrayList<>();
        }
        
        // JPA 조인을 사용하여 참여자 목록 조회
        List<TradeParticipant> participants = participantRepository.findByUserNickname(participantName.trim());
        
        // 모든 실매매를 반환하되 정렬
        return participants.stream()
                .map(TradeParticipant::getRealTrade)
                .sorted((a, b) -> {
                    // ACTIVE가 먼저 오도록, 그 다음 생성일 내림차순
                    if (a.getStatus().equals("ACTIVE") && !b.getStatus().equals("ACTIVE")) {
                        return -1;
                    }
                    if (!a.getStatus().equals("ACTIVE") && b.getStatus().equals("ACTIVE")) {
                        return 1;
                    }
                    // 같은 상태면 생성일 내림차순
                    if (a.getCreatedAt() != null && b.getCreatedAt() != null) {
                        return b.getCreatedAt().compareTo(a.getCreatedAt());
                    }
                    return 0;
                })
                .collect(Collectors.toList());
    }
    // [변경 끝]
    
    // DTO 변환 메서드: RealTrade 엔티티를 RealTradeResponseDto로 변환
    public RealTradeResponseDto convertToDto(RealTrade realTrade) {
        RealTradeResponseDto dto = new RealTradeResponseDto();
        dto.setId(realTrade.getId());
        dto.setStockName(realTrade.getStockName());
        dto.setStockCode(realTrade.getStockCode());
        dto.setStartDate(realTrade.getStartDate());
        dto.setEndDate(realTrade.getEndDate());
        dto.setInvestPer(realTrade.getInvestPer());
        dto.setStatus(realTrade.getStatus());
        dto.setCreatedAt(realTrade.getCreatedAt());
        dto.setAveragePrice(realTrade.getAveragePrice());
        dto.setCurrentBuyCount(realTrade.getCurrentBuyCount());
        dto.setTargetBuyCount(realTrade.getTargetBuyCount());
        dto.setCurrentPrice(realTrade.getCurrentPrice());
        dto.setStartPrice(realTrade.getStartPrice());
        dto.setFinalReturnRate(realTrade.getFinalReturnRate());
        dto.setFinalPeriod(realTrade.getFinalPeriod());
        
        // 참여자 목록을 ParticipantDto로 변환
        List<ParticipantDto> participants = realTrade.getParticipants().stream()
                .map(tp -> new ParticipantDto(
                        tp.getUser().getId(),
                        tp.getUser().getNickname(),
                        tp.getJoinedAt()
                ))
                .collect(Collectors.toList());
        dto.setParticipants(participants);
        
        // buyPrice 조회 (Jugot 데이터에서)
        Integer buyPrice = null;
        try {
            if (realTrade.getStartDate() != null) {
                java.util.Optional<Jugot> startJugot = jugotRepository.findByStockCodeAndCaptureDate(
                        realTrade.getStockCode(), realTrade.getStartDate()
                );
                if (startJugot.isPresent()) {
                    buyPrice = startJugot.get().getCapturePrice();
                }
            }
        } catch (Exception e) {
            // 조회 실패 시 무시
            System.err.println("Error fetching buyPrice for " + realTrade.getStockCode() + ": " + e.getMessage());
        }
        dto.setBuyPrice(buyPrice);
        
        return dto;
    }
    
    // DTO 리스트 변환 메서드
    public List<RealTradeResponseDto> convertToDtoList(List<RealTrade> realTrades) {
        return realTrades.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
}


