package com.chatspring.chatspring.jugot;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class JugotService {

    private final JugotRepository repository;

    public JugotService(JugotRepository repository) {
        this.repository = repository;
    }

    // 한글 컬럼명을 영문 필드명으로 매핑하는 맵
    private Map<String, String> getColumnNameMapping() {
        Map<String, String> mapping = new HashMap<>();
        mapping.put("종목코드", "stock_code");
        mapping.put("종목명", "stock_name");
        mapping.put("종가", "close_price");
        mapping.put("송곳일", "capture_date");
        mapping.put("포착가", "capture_price");
        mapping.put("시장구분", "market");
        return mapping;
    }

    // 컬럼명을 영문 필드명으로 변환 (한글이면 매핑, 아니면 그대로)
    private String normalizeColumnName(String columnName) {
        if (columnName == null) {
            return null;
        }
        String trimmed = columnName.trim();
        Map<String, String> mapping = getColumnNameMapping();
        return mapping.getOrDefault(trimmed, trimmed);
    }

    // 수정: (year, month, weekInMonth)로 기간 계산 (월 기준 1주차~5주차, 월요일 시작, 일요일 끝)
    public List<JugotDto> getByYearMonthWeek(int year, int month, int weekInMonth) {
        LocalDate[] range = computeWeekRangeOfMonth(year, month, weekInMonth);
        List<Jugot> rows = repository.findByCaptureDateBetween(range[0], range[1]);
        List<JugotDto> out = new ArrayList<>();

        for (Jugot e : rows) {
            JugotDto dto = convertToDto(e);
            if (dto != null) {
                out.add(dto);
            }
        }
        return out;
    }

    // 모든 주차 데이터를 한 번에 가져오는 메서드 (N+1 문제 해결: 5번의 DB 조회를 1번으로 최적화)
    public Map<String, List<JugotDto>> getAllWeeksInMonth(int year, int month) {
        Map<String, List<JugotDto>> result = new HashMap<>();

        // 1. 1주차의 시작일과 5주차의 종료일을 계산하여 전체 범위를 구합니다.
        LocalDate[] firstWeekRange = computeWeekRangeOfMonth(year, month, 1);
        LocalDate[] lastWeekRange = computeWeekRangeOfMonth(year, month, 5);
        
        LocalDate startDate = firstWeekRange[0];
        LocalDate endDate = lastWeekRange[1];

        // 2. DB 접속은 딱 1번만 수행 (Batch 조회)
        List<Jugot> allRows = repository.findByCaptureDateBetween(startDate, endDate);

        // 3. Java 메모리에서 주차별로 필터링 (DB 부하 감소)
        for (int week = 1; week <= 5; week++) {
            LocalDate[] range = computeWeekRangeOfMonth(year, month, week);
            LocalDate wStart = range[0];
            LocalDate wEnd = range[1];
            
            List<JugotDto> weekData = allRows.stream()
                .filter(j -> {
                    LocalDate captureDate = j.getCaptureDate();
                    return captureDate != null && 
                           !captureDate.isBefore(wStart) && 
                           !captureDate.isAfter(wEnd);
                })
                .map(this::convertToDto)
                .filter(dto -> dto != null)
                .collect(java.util.stream.Collectors.toList());
            
            if (!weekData.isEmpty()) {
                result.put(week + "주차", weekData);
            }
        }

        return result;
    }

    // 수정: 월 기준 N주차(1~5) 범위 계산 (월요일~일요일)
    private LocalDate[] computeWeekRangeOfMonth(int year, int month, int weekInMonth) {
        YearMonth ym = YearMonth.of(year, month);
        LocalDate first = ym.atDay(1);
        
        // 해당 월의 첫 월요일 찾기
        LocalDate firstMonday = first.with(DayOfWeek.MONDAY);
        
        // 만약 1일이 월요일보다 늦다면, 그 주의 월요일은 이전 월에 속함
        // 따라서 다음주 월요일을 첫 주차로 사용
        if (first.isAfter(firstMonday)) {
            firstMonday = firstMonday.plusWeeks(1);
        }

        // 해당 주차의 시작일 계산
        LocalDate start = firstMonday.plusWeeks(weekInMonth - 1);
        LocalDate end = start.plusDays(6);

        // 월 경계를 벗어나지 않도록 보정
        LocalDate monthStart = ym.atDay(1);
        LocalDate monthEnd = ym.atEndOfMonth();
        if (start.isBefore(monthStart)) start = monthStart;
        if (end.isAfter(monthEnd)) end = monthEnd;

        return new LocalDate[]{ start, end };
    }

    // DTO 변환 헬퍼 메서드 (중복 제거용)
    private JugotDto convertToDto(Jugot e) {
        if (e == null) return null;
        
        // NPE 방지를 위해 null 체크
        String name = safe(() -> e.getStockName());
        Integer capturePrice = safe(() -> e.getCapturePrice());
        LocalDate captureDate = safe(() -> e.getCaptureDate());
        String market = safe(() -> e.getMarketType());
        Integer currentPrice = safe(() -> e.getCurrentPrice());
        Integer highestPrice = safe(() -> e.getHighestPrice());
        Integer lowestPrice = safe(() -> e.getLowestPrice());
        
        // 필수 필드만 체크 (name, capturePrice)
        if (name == null || capturePrice == null) {
            System.out.println("Jugot 데이터에 필수 필드(null)가 있어 건너뜁니다: " + e);
            return null;
        }
        
        return new JugotDto(name, capturePrice, captureDate, market, currentPrice, highestPrice, lowestPrice);
    }

    // NPE 방지용
    private static <T> T safe(SupplierWithEx<T> s) {
        try { return s.get(); } catch (Throwable t) { return null; }
    }

    // 엑셀/CSV 파일 업로드 및 유효성 검증
    public Map<String, Object> uploadAndValidateExcel(MultipartFile file) {
        Map<String, Object> result = new HashMap<>();
        List<String> errors = new ArrayList<>();
        List<Map<String, Object>> failedRows = new ArrayList<>(); // 실패한 행 상세 정보
        List<Jugot> validJugots = new ArrayList<>();
        int totalRows = 0;
        
        try {
            // 파일 확장자 검증
            String fileName = file.getOriginalFilename();
            if (fileName == null || (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls") && !fileName.endsWith(".csv"))) {
                errors.add("엑셀 파일(.xlsx, .xls) 또는 CSV 파일(.csv)만 업로드 가능합니다.");
                result.put("success", false);
                result.put("errors", errors);
                return result;
            }
            
            // CSV 파일인 경우
            if (fileName.endsWith(".csv")) {
                return parseAndValidateCSV(file, result, errors, failedRows, validJugots);
            }
            
            InputStream inputStream = file.getInputStream();
            Workbook workbook;
            if (fileName.endsWith(".xlsx")) {
                workbook = new XSSFWorkbook(inputStream);
            } else {
                workbook = new HSSFWorkbook(inputStream);
            }
            Sheet sheet = workbook.getSheetAt(0);
            
            // 헤더 행 읽기 및 검증
            Row headerRow = sheet.getRow(0);
            if (headerRow == null) {
                errors.add("엑셀 파일의 첫 번째 행이 비어있습니다.");
                result.put("success", false);
                result.put("errors", errors);
                workbook.close();
                return result;
            }
            
            // 필수 컬럼명 정의
            Map<String, Integer> columnMap = new HashMap<>();
            String[] requiredColumns = {"stock_name", "stock_code", "capture_price", "capture_date"};
            String[] optionalColumns = {"market","highest_price", "lowest_price"};
            
            // 헤더에서 컬럼 인덱스 찾기 (한글 컬럼명을 영문으로 변환)
            for (int i = 0; i < headerRow.getLastCellNum(); i++) {
                Cell cell = headerRow.getCell(i);
                if (cell != null) {
                    String cellValue = getCellValueAsString(cell);
                    String normalizedColumnName = normalizeColumnName(cellValue);
                    columnMap.put(normalizedColumnName, i);
                }
            }
            
            // 필수 컬럼 검증
            for (String col : requiredColumns) {
                if (!columnMap.containsKey(col)) {
                    errors.add("필수 컬럼 '" + col + "'가 없습니다.");
                }
            }
            
            if (!errors.isEmpty()) {
                result.put("success", false);
                result.put("errors", errors);
                workbook.close();
                return result;
            }
            
            // 데이터 행 검증 및 파싱
            int rowNum = 1; // 첫 번째 데이터 행부터 시작
            while (rowNum <= sheet.getLastRowNum()) {
                Row row = sheet.getRow(rowNum);
                if (row == null) {
                    rowNum++;
                    continue;
                }
                
                // 빈 행 체크
                boolean isEmptyRow = true;
                for (int i = 0; i < row.getLastCellNum(); i++) {
                    Cell cell = row.getCell(i);
                    if (cell != null && !getCellValueAsString(cell).trim().isEmpty()) {
                        isEmptyRow = false;
                        break;
                    }
                }
                if (isEmptyRow) {
                    rowNum++;
                    continue;
                }
                
                totalRows++;
                String stockNameForError = null;
                
                try {
                    Jugot jugot = new Jugot();
                    
                    // stock_name (필수)
                    String stockName = getCellValue(row, columnMap.get("stock_name"));
                    stockNameForError = stockName != null ? stockName.trim() : "";
                    if (stockName == null || stockName.trim().isEmpty()) {
                        Map<String, Object> failedRow = new HashMap<>();
                        failedRow.put("row", rowNum + 1);
                        failedRow.put("stockName", stockNameForError.isEmpty() ? "(없음)" : stockNameForError);
                        failedRow.put("reason", "stock_name이 비어있습니다.");
                        failedRows.add(failedRow);
                        errors.add((rowNum + 1) + "번째 행: stock_name이 비어있습니다.");
                        rowNum++;
                        continue;
                    }
                    jugot.setStockName(stockName.trim());
                    
                    // stock_code (필수) - 앞의 0을 유지하기 위해 특별한 메서드 사용
                    Integer stockCodeColumnIndex = columnMap.get("stock_code");
                    String stockCode = null;
                    if (stockCodeColumnIndex != null) {
                        Cell stockCodeCell = row.getCell(stockCodeColumnIndex);
                        if (stockCodeCell != null) {
                            String value = getCellValueAsStringForStockCode(stockCodeCell);
                            stockCode = value != null && !value.trim().isEmpty() ? value.trim() : null;
                        }
                    }
                    if (stockCode == null || stockCode.isEmpty()) {
                        Map<String, Object> failedRow = new HashMap<>();
                        failedRow.put("row", rowNum + 1);
                        failedRow.put("stockName", stockNameForError);
                        failedRow.put("reason", "stock_code가 비어있습니다.");
                        failedRows.add(failedRow);
                        errors.add((rowNum + 1) + "번째 행: stock_code가 비어있습니다.");
                        rowNum++;
                        continue;
                    }
                    // stock_code를 6자리로 패딩 (앞에 0 채우기)
                    stockCode = padStockCode(stockCode);
                    jugot.setStockCode(stockCode);
                    
                    // capture_price (필수, Integer)
                    Integer capturePrice = getCellValueAsInteger(row, columnMap.get("capture_price"));
                    if (capturePrice == null) {
                        Map<String, Object> failedRow = new HashMap<>();
                        failedRow.put("row", rowNum + 1);
                        failedRow.put("stockName", stockNameForError);
                        failedRow.put("reason", "capture_price가 유효한 숫자가 아닙니다.");
                        failedRows.add(failedRow);
                        errors.add((rowNum + 1) + "번째 행: capture_price가 유효한 숫자가 아닙니다.");
                        rowNum++;
                        continue;
                    }
                    jugot.setCapturePrice(capturePrice);
                    
                    // capture_date (필수, LocalDate)
                    LocalDate captureDate = getCellValueAsDate(row, columnMap.get("capture_date"));
                    if (captureDate == null) {
                        Map<String, Object> failedRow = new HashMap<>();
                        failedRow.put("row", rowNum + 1);
                        failedRow.put("stockName", stockNameForError);
                        failedRow.put("reason", "capture_date가 유효한 날짜 형식이 아닙니다.");
                        failedRows.add(failedRow);
                        errors.add((rowNum + 1) + "번째 행: capture_date가 유효한 날짜 형식이 아닙니다.");
                        rowNum++;
                        continue;
                    }
                    jugot.setCaptureDate(captureDate);
                    
//                    // current_price (필수, Integer)
//                    Integer currentPrice = getCellValueAsInteger(row, columnMap.get("current_price"));
//                    if (currentPrice == null) {
//                        Map<String, Object> failedRow = new HashMap<>();
//                        failedRow.put("row", rowNum + 1);
//                        failedRow.put("stockName", stockNameForError);
//                        failedRow.put("reason", "current_price가 유효한 숫자가 아닙니다.");
//                        failedRows.add(failedRow);
//                        errors.add((rowNum + 1) + "번째 행: current_price가 유효한 숫자가 아닙니다.");
//                        rowNum++;
//                        continue;
//                    }
//                    jugot.setCurrentPrice(currentPrice);
//
//                    // highest_price (필수, Integer)
//                    Integer highestPrice = getCellValueAsInteger(row, columnMap.get("highest_price"));
//                    if (highestPrice == null) {
//                        Map<String, Object> failedRow = new HashMap<>();
//                        failedRow.put("row", rowNum + 1);
//                        failedRow.put("stockName", stockNameForError);
//                        failedRow.put("reason", "highest_price가 유효한 숫자가 아닙니다.");
//                        failedRows.add(failedRow);
//                        errors.add((rowNum + 1) + "번째 행: highest_price가 유효한 숫자가 아닙니다.");
//                        rowNum++;
//                        continue;
//                    }
//                    jugot.setHighestPrice(highestPrice);
//
//                    // lowest_price (필수, Integer)
//                    Integer lowestPrice = getCellValueAsInteger(row, columnMap.get("lowest_price"));
//                    if (lowestPrice == null) {
//                        Map<String, Object> failedRow = new HashMap<>();
//                        failedRow.put("row", rowNum + 1);
//                        failedRow.put("stockName", stockNameForError);
//                        failedRow.put("reason", "lowest_price가 유효한 숫자가 아닙니다.");
//                        failedRows.add(failedRow);
//                        errors.add((rowNum + 1) + "번째 행: lowest_price가 유효한 숫자가 아닙니다.");
//                        rowNum++;
//                        continue;
//                    }
//                    jugot.setLowestPrice(lowestPrice);
                    
                    // market 또는 market_type (선택, String) - 시장구분
                    String marketType = null;
                    if (columnMap.containsKey("market")) {
                        marketType = getCellValue(row, columnMap.get("market"));
                    } else if (columnMap.containsKey("market_type")) {
                        marketType = getCellValue(row, columnMap.get("market_type"));
                    }
                    if (marketType != null && !marketType.trim().isEmpty()) {
                        jugot.setMarketType(marketType.trim());
                    }
                    
                    // 중복 검사: 포착일과 종목명이 같은 데이터가 이미 DB에 있는지 확인
                    Optional<Jugot> existing = repository.findByStockNameAndCaptureDate(
                        jugot.getStockName(), jugot.getCaptureDate());
                    if (existing.isPresent()) {
                        Map<String, Object> failedRow = new HashMap<>();
                        failedRow.put("row", rowNum + 1);
                        failedRow.put("stockName", stockNameForError);
                        failedRow.put("reason", "중복된 데이터입니다. (종목명: " + jugot.getStockName() + 
                            ", 포착일: " + jugot.getCaptureDate() + "가 이미 존재합니다)");
                        failedRows.add(failedRow);
                        errors.add((rowNum + 1) + "번째 행: 중복된 데이터입니다. (종목명: " + jugot.getStockName() + 
                            ", 포착일: " + jugot.getCaptureDate() + ")");
                        rowNum++;
                        continue;
                    }
                    
                    // 같은 파일 내에서도 중복 체크 (같은 파일에 같은 종목명+포착일이 여러 개 있는 경우)
                    boolean isDuplicateInFile = false;
                    for (Jugot existingJugot : validJugots) {
                        if (existingJugot.getStockName().equals(jugot.getStockName()) && 
                            existingJugot.getCaptureDate().equals(jugot.getCaptureDate())) {
                            isDuplicateInFile = true;
                            break;
                        }
                    }
                    if (isDuplicateInFile) {
                        Map<String, Object> failedRow = new HashMap<>();
                        failedRow.put("row", rowNum + 1);
                        failedRow.put("stockName", stockNameForError);
                        failedRow.put("reason", "파일 내 중복된 데이터입니다. (종목명: " + jugot.getStockName() + 
                            ", 포착일: " + jugot.getCaptureDate() + ")");
                        failedRows.add(failedRow);
                        errors.add((rowNum + 1) + "번째 행: 파일 내 중복된 데이터입니다. (종목명: " + jugot.getStockName() + 
                            ", 포착일: " + jugot.getCaptureDate() + ")");
                        rowNum++;
                        continue;
                    }
                    
                    validJugots.add(jugot);
                    
                } catch (Exception e) {
                    Map<String, Object> failedRow = new HashMap<>();
                    failedRow.put("row", rowNum + 1);
                    failedRow.put("stockName", stockNameForError != null ? stockNameForError : "(없음)");
                    failedRow.put("reason", "처리 중 오류: " + e.getMessage());
                    failedRows.add(failedRow);
                    errors.add((rowNum + 1) + "번째 행 처리 중 오류: " + e.getMessage());
                }
                
                rowNum++;
            }
            
            workbook.close();
            
            // 유효성 검증 결과
            int successCount = validJugots.size();
            int failCount = failedRows.size();
            
            result.put("totalRows", totalRows);
            result.put("successCount", successCount);
            result.put("failCount", failCount);
            result.put("failedRows", failedRows);
            
            if (!errors.isEmpty()) {
                result.put("success", false);
                result.put("errors", errors);
                result.put("validCount", successCount);
                return result;
            }
            
            // 모든 데이터가 유효하면 DB에 저장
            repository.saveAll(validJugots);
            
            result.put("success", true);
            result.put("message", totalRows + "건 중 " + successCount + "건 성공적으로 업로드되었습니다.");
            result.put("uploadedCount", successCount);
            
        } catch (Exception e) {
            errors.add("파일 처리 중 오류가 발생했습니다: " + e.getMessage());
            result.put("success", false);
            result.put("errors", errors);
        }
        
        return result;
    }
    
    // 셀 값을 String으로 가져오기 (한글 처리 개선, stock_code 등 앞의 0 유지)
    private String getCellValueAsString(Cell cell) {
        if (cell == null) return "";
        
        try {
            // DataFormatter를 사용하여 한글을 안전하게 읽기
            // DataFormatter는 Excel 셀의 원본 포맷을 유지하므로 앞의 0도 보존됩니다
            DataFormatter formatter = new DataFormatter();
            String formattedValue = formatter.formatCellValue(cell);
            
            // DataFormatter 결과가 있으면 반환 (앞의 0이 유지됨)
            if (formattedValue != null && !formattedValue.trim().isEmpty()) {
                return formattedValue;
            }
            
            // 폴백: 기본 셀 타입별 처리
            switch (cell.getCellType()) {
                case STRING:
                    return cell.getStringCellValue();
                case NUMERIC:
                    if (DateUtil.isCellDateFormatted(cell)) {
                        return cell.getDateCellValue().toString();
                    } else {
                        // NUMERIC 타입인 경우에도 DataFormatter를 사용하여 원본 포맷 유지 시도
                        // 셀의 포맷 정보가 있으면 이를 활용
                        try {
                            CellStyle style = cell.getCellStyle();
                            if (style != null) {
                                DataFormat dataFormat = cell.getSheet().getWorkbook().getCreationHelper().createDataFormat();
                                String formatString = style.getDataFormatString();
                                // 숫자 포맷이 있는 경우 (예: "000000") 원본 형식 유지
                                if (formatString != null && formatString.contains("0")) {
                                    return formatter.formatCellValue(cell);
                                }
                            }
                        } catch (Exception ex) {
                            // 포맷 정보 읽기 실패 시 기본 처리로 진행
                        }
                        // 소수점 제거
                        double numericValue = cell.getNumericCellValue();
                        if (numericValue == (long) numericValue) {
                            return String.valueOf((long) numericValue);
                        } else {
                            return String.valueOf(numericValue);
                        }
                    }
                case BOOLEAN:
                    return String.valueOf(cell.getBooleanCellValue());
                case FORMULA:
                    // FORMULA 타입인 경우에도 DataFormatter 사용
                    try {
                        return formatter.formatCellValue(cell);
                    } catch (Exception ex) {
                        return cell.getCellFormula();
                    }
                default:
                    return "";
            }
        } catch (Exception e) {
            // 예외 발생 시 기본 방식으로 처리
            switch (cell.getCellType()) {
                case STRING:
                    return cell.getStringCellValue();
                default:
                    return "";
            }
        }
    }
    
    // 셀 값을 String으로 가져오기 (null 가능)
    private String getCellValue(Row row, Integer columnIndex) {
        if (columnIndex == null) return null;
        Cell cell = row.getCell(columnIndex);
        if (cell == null) return null;
        String value = getCellValueAsString(cell);
        return value.isEmpty() ? null : value;
    }
    
    // stock_code 전용: 항상 문자열로 처리하여 앞의 0 유지
    private String getCellValueAsStringForStockCode(Cell cell) {
        if (cell == null) return "";
        
        try {
            // DataFormatter를 사용하여 Excel 셀의 원본 포맷 유지
            // 이렇게 하면 텍스트로 저장된 경우 앞의 0이 유지됩니다
            DataFormatter formatter = new DataFormatter();
            String formattedValue = formatter.formatCellValue(cell);
            
            if (formattedValue != null && !formattedValue.trim().isEmpty()) {
                return formattedValue;
            }
            
            // 폴백: 셀 타입별 처리
            switch (cell.getCellType()) {
                case STRING:
                    return cell.getStringCellValue();
                case NUMERIC:
                    // NUMERIC 타입인 경우에도 DataFormatter 결과를 우선 사용
                    // Excel에서 숫자로 저장된 경우 앞의 0은 이미 사라졌지만,
                    // 포맷 정보가 있으면 최대한 유지 시도
                    if (DateUtil.isCellDateFormatted(cell)) {
                        return cell.getDateCellValue().toString();
                    } else {
                        // 숫자로 저장된 경우, 원본 포맷 정보 확인
                        try {
                            CellStyle style = cell.getCellStyle();
                            if (style != null) {
                                String formatString = style.getDataFormatString();
                                // 포맷이 "000000" 같은 형식이면 DataFormatter가 이를 유지하려고 시도
                                if (formatString != null && formatString.contains("0")) {
                                    return formatter.formatCellValue(cell);
                                }
                            }
                        } catch (Exception ex) {
                            // 포맷 정보 읽기 실패 시 기본 처리
                        }
                        // 최후의 수단: 숫자를 문자열로 변환 (앞의 0은 이미 사라짐)
                        double numericValue = cell.getNumericCellValue();
                        if (numericValue == (long) numericValue) {
                            return String.valueOf((long) numericValue);
                        } else {
                            return String.valueOf(numericValue);
                        }
                    }
                case FORMULA:
                    // FORMULA 타입인 경우 DataFormatter 사용
                    try {
                        return formatter.formatCellValue(cell);
                    } catch (Exception ex) {
                        return cell.getCellFormula();
                    }
                default:
                    return "";
            }
        } catch (Exception e) {
            // 예외 발생 시 기본 방식으로 처리
            switch (cell.getCellType()) {
                case STRING:
                    return cell.getStringCellValue();
                default:
                    return "";
            }
        }
    }
    
    // 셀 값을 Integer로 가져오기
    private Integer getCellValueAsInteger(Row row, Integer columnIndex) {
        if (columnIndex == null) return null;
        Cell cell = row.getCell(columnIndex);
        if (cell == null) return null;
        
        try {
            switch (cell.getCellType()) {
                case NUMERIC:
                    double numericValue = cell.getNumericCellValue();
                    return (int) numericValue;
                case STRING:
                    String strValue = cell.getStringCellValue().trim();
                    if (strValue.isEmpty()) return null;
                    // 소수점 제거 후 정수로 변환
                    if (strValue.contains(".")) {
                        strValue = strValue.substring(0, strValue.indexOf("."));
                    }
                    return Integer.parseInt(strValue);
                default:
                    return null;
            }
        } catch (Exception e) {
            return null;
        }
    }
    
    // 셀 값을 LocalDate로 가져오기
    private LocalDate getCellValueAsDate(Row row, Integer columnIndex) {
        if (columnIndex == null) return null;
        Cell cell = row.getCell(columnIndex);
        if (cell == null) return null;
        
        try {
            switch (cell.getCellType()) {
                case NUMERIC:
                    if (DateUtil.isCellDateFormatted(cell)) {
                        return cell.getDateCellValue().toInstant()
                                .atZone(java.time.ZoneId.systemDefault())
                                .toLocalDate();
                    } else {
                        // 숫자 형식의 날짜 (예: 20250101)
                        double numericValue = cell.getNumericCellValue();
                        String dateStr = String.valueOf((long) numericValue);
                        if (dateStr.length() == 8) {
                            return LocalDate.parse(dateStr, DateTimeFormatter.ofPattern("yyyyMMdd"));
                        }
                        return null;
                    }
                case STRING:
                    String strValue = cell.getStringCellValue().trim();
                    if (strValue.isEmpty()) return null;
                    
                    // 다양한 날짜 형식 시도
                    String[] dateFormats = {
                        "yyyy-MM-dd", "yyyy/MM/dd", "yyyyMMdd",
                        "yyyy.MM.dd", "MM/dd/yyyy", "dd/MM/yyyy"
                    };
                    
                    for (String format : dateFormats) {
                        try {
                            return LocalDate.parse(strValue, DateTimeFormatter.ofPattern(format));
                        } catch (DateTimeParseException e) {
                            // 다음 형식 시도
                        }
                    }
                    
                    // 숫자 형식도 시도
                    if (strValue.length() == 8 && strValue.matches("\\d+")) {
                        try {
                            return LocalDate.parse(strValue, DateTimeFormatter.ofPattern("yyyyMMdd"));
                        } catch (DateTimeParseException e) {
                            // 무시
                        }
                    }
                    
                    return null;
                default:
                    return null;
            }
        } catch (Exception e) {
            return null;
        }
    }

    // CSV 파일 파싱 및 유효성 검증
    private Map<String, Object> parseAndValidateCSV(MultipartFile file, Map<String, Object> result, 
                                                    List<String> errors, List<Map<String, Object>> failedRows,
                                                    List<Jugot> validJugots) {
        int totalRows = 0;
        
        try {
            // 인코딩 자동 감지 (수정된 로직)
            BufferedReader reader = null;
            String detectedEncoding = null;
            String fallbackEncoding = null; // 한글이 없는 경우(예: 영어/숫자 파일)를 위한 폴백
            
            // 한글을 지원하는 주요 인코딩 순서 (UTF-8을 우선 검사)
            String[] encodings = {"UTF-8", "MS949", "EUC-KR"};
            
            // 바이트 배열로 먼저 읽기
            byte[] fileBytes = file.getBytes();
            
            for (String encoding : encodings) {
                try {
                    ByteArrayInputStream byteStream = new ByteArrayInputStream(fileBytes);
                    reader = new BufferedReader(new InputStreamReader(byteStream, encoding));
                    
                    String line;
                    boolean foundKorean = false; // 한글을 찾았는지 여부
                    boolean isBroken = false;    // 깨진 문자를 찾았는지 여부
                    int linesRead = 0;           // 검사한 라인 수
                    
                    // 파일의 처음 10줄(또는 끝까지)을 읽어 한글/깨짐 여부 동시 검사
                    while (linesRead < 10 && (line = reader.readLine()) != null) {
                        if (line.isEmpty()) continue;
                        linesRead++;
                        
                        if (line.contains("\uFFFD")) { // \uFFFD ()는 명백히 깨진 문자
                            isBroken = true;
                            break; // 이 인코딩은 아님
                        }
                        if (line.matches(".*[가-힣].*")) {
                            foundKorean = true; // 한글을 찾음
                        }
                    }
                    reader.close(); // 테스트 리더 닫기
                    
                    if (isBroken) {
                        // 이 인코딩은 깨진 문자를 만듦. 다음 인코딩 시도.
                        continue;
                    }
                    
                    if (foundKorean) {
                        // "한글"을 "깨짐 없이" 찾음. 이것이 정답.
                        detectedEncoding = encoding;
                        break; // 인코딩 탐색 종료
                    }
                    
                    // (깨지지 않았지만 한글도 못 찾은 경우)
                    if (fallbackEncoding == null) {
                        // 첫 번째로 성공한(안 깨진) 인코딩을 폴백으로 지정
                        // (예: 헤더만 있거나, 영어/숫자로만 구성된 파일)
                        fallbackEncoding = encoding;
                    }
                    
                } catch (Exception e) {
                    if (reader != null) {
                        try {
                            reader.close();
                        } catch (Exception closeEx) {
                            // 무시
                        }
                    }
                    continue; // 예외 발생 시 다음 인코딩 시도
                }
            }
            
            // Case 1: 한글을 깨짐 없이 찾음
            // (detectedEncoding에 "UTF-8" 또는 "MS949"가 할당됨)
            
            // Case 2: 한글을 못 찾았지만, 깨지지도 않음
            if (detectedEncoding == null) {
                // 폴백 인코딩(주로 UTF-8)을 사용
                detectedEncoding = (fallbackEncoding != null) ? fallbackEncoding : "UTF-8"; // 최후의 보루
            }
            
            // 감지된 인코딩으로 최종 리더 생성
            ByteArrayInputStream byteStream = new ByteArrayInputStream(fileBytes);
            reader = new BufferedReader(new InputStreamReader(byteStream, detectedEncoding));
            
            // 헤더 행 읽기
            String headerLine = reader.readLine();
            if (headerLine == null || headerLine.trim().isEmpty()) {
                errors.add("CSV 파일의 첫 번째 행이 비어있습니다.");
                result.put("success", false);
                result.put("errors", errors);
                return result;
            }
            
            // CSV 헤더 파싱 (쉼표로 구분, 따옴표 처리)
            String[] headers = parseCSVLine(headerLine);
            
            // 헤더의 첫 번째 항목에 BOM(Byte Order Mark)이 있는지 확인하고 제거
            if (headers.length > 0 && headers[0].startsWith("\uFEFF")) {
                headers[0] = headers[0].substring(1);
            }
            
            Map<String, Integer> columnMap = new HashMap<>();
            for (int i = 0; i < headers.length; i++) {
                String normalizedColumnName = normalizeColumnName(headers[i]);
                columnMap.put(normalizedColumnName, i);
            }
            
            // 필수 컬럼 검증
            String[] requiredColumns = {"stock_name", "stock_code", "capture_price", "capture_date"};
            String[] optionalColumns = {"market","highest_price", "lowest_price"};
            
            for (String col : requiredColumns) {
                if (!columnMap.containsKey(col)) {
                    errors.add("필수 컬럼 '" + col + "'가 없습니다.");
                }
            }
            
            if (!errors.isEmpty()) {
                result.put("success", false);
                result.put("errors", errors);
                return result;
            }
            
            // 데이터 행 파싱
            String line;
            int rowNum = 1; // 헤더 다음부터 시작
            while ((line = reader.readLine()) != null) {
                if (line.trim().isEmpty()) {
                    continue; // 빈 행 건너뛰기
                }
                
                totalRows++;
                String[] values = parseCSVLine(line);
                String stockNameForError = null;
                
                try {
                    Jugot jugot = new Jugot();
                    
                    // stock_name (필수)
                    if (columnMap.get("stock_name") >= values.length) {
                        Map<String, Object> failedRow = new HashMap<>();
                        failedRow.put("row", rowNum + 1);
                        failedRow.put("stockName", "(없음)");
                        failedRow.put("reason", "stock_name 컬럼이 없습니다.");
                        failedRows.add(failedRow);
                        errors.add((rowNum + 1) + "번째 행: stock_name 컬럼이 없습니다.");
                        rowNum++;
                        continue;
                    }
                    
                    String stockName = values[columnMap.get("stock_name")].trim();
                    stockNameForError = stockName;
                    if (stockName.isEmpty()) {
                        Map<String, Object> failedRow = new HashMap<>();
                        failedRow.put("row", rowNum + 1);
                        failedRow.put("stockName", "(없음)");
                        failedRow.put("reason", "stock_name이 비어있습니다.");
                        failedRows.add(failedRow);
                        errors.add((rowNum + 1) + "번째 행: stock_name이 비어있습니다.");
                        rowNum++;
                        continue;
                    }
                    jugot.setStockName(stockName);
                    
                    // stock_code (필수)
                    if (columnMap.get("stock_code") >= values.length || values[columnMap.get("stock_code")].trim().isEmpty()) {
                        Map<String, Object> failedRow = new HashMap<>();
                        failedRow.put("row", rowNum + 1);
                        failedRow.put("stockName", stockNameForError);
                        failedRow.put("reason", "stock_code가 비어있습니다.");
                        failedRows.add(failedRow);
                        errors.add((rowNum + 1) + "번째 행: stock_code가 비어있습니다.");
                        rowNum++;
                        continue;
                    }
                    // stock_code를 6자리로 패딩 (앞에 0 채우기)
                    String stockCode = padStockCode(values[columnMap.get("stock_code")].trim());
                    jugot.setStockCode(stockCode);
                    
                    // capture_price (필수, Integer)
                    Integer capturePrice = parseInteger(values, columnMap.get("capture_price"));
                    if (capturePrice == null) {
                        Map<String, Object> failedRow = new HashMap<>();
                        failedRow.put("row", rowNum + 1);
                        failedRow.put("stockName", stockNameForError);
                        failedRow.put("reason", "capture_price가 유효한 숫자가 아닙니다.");
                        failedRows.add(failedRow);
                        errors.add((rowNum + 1) + "번째 행: capture_price가 유효한 숫자가 아닙니다.");
                        rowNum++;
                        continue;
                    }
                    jugot.setCapturePrice(capturePrice);
                    
                    // capture_date (필수, LocalDate)
                    LocalDate captureDate = parseDate(values, columnMap.get("capture_date"));
                    if (captureDate == null) {
                        Map<String, Object> failedRow = new HashMap<>();
                        failedRow.put("row", rowNum + 1);
                        failedRow.put("stockName", stockNameForError);
                        failedRow.put("reason", "capture_date가 유효한 날짜 형식이 아닙니다.");
                        failedRows.add(failedRow);
                        errors.add((rowNum + 1) + "번째 행: capture_date가 유효한 날짜 형식이 아닙니다.");
                        rowNum++;
                        continue;
                    }
                    jugot.setCaptureDate(captureDate);
                    
//                    // current_price (필수, Integer)
//                    Integer currentPrice = parseInteger(values, columnMap.get("current_price"));
//                    if (currentPrice == null) {
//                        Map<String, Object> failedRow = new HashMap<>();
//                        failedRow.put("row", rowNum + 1);
//                        failedRow.put("stockName", stockNameForError);
//                        failedRow.put("reason", "current_price가 유효한 숫자가 아닙니다.");
//                        failedRows.add(failedRow);
//                        errors.add((rowNum + 1) + "번째 행: current_price가 유효한 숫자가 아닙니다.");
//                        rowNum++;
//                        continue;
//                    }
//                    jugot.setCurrentPrice(currentPrice);
//
//                    // highest_price (필수, Integer)
//                    Integer highestPrice = parseInteger(values, columnMap.get("highest_price"));
//                    if (highestPrice == null) {
//                        Map<String, Object> failedRow = new HashMap<>();
//                        failedRow.put("row", rowNum + 1);
//                        failedRow.put("stockName", stockNameForError);
//                        failedRow.put("reason", "highest_price가 유효한 숫자가 아닙니다.");
//                        failedRows.add(failedRow);
//                        errors.add((rowNum + 1) + "번째 행: highest_price가 유효한 숫자가 아닙니다.");
//                        rowNum++;
//                        continue;
//                    }
//                    jugot.setHighestPrice(highestPrice);
//
//                    // lowest_price (필수, Integer)
//                    Integer lowestPrice = parseInteger(values, columnMap.get("lowest_price"));
//                    if (lowestPrice == null) {
//                        Map<String, Object> failedRow = new HashMap<>();
//                        failedRow.put("row", rowNum + 1);
//                        failedRow.put("stockName", stockNameForError);
//                        failedRow.put("reason", "lowest_price가 유효한 숫자가 아닙니다.");
//                        failedRows.add(failedRow);
//                        errors.add((rowNum + 1) + "번째 행: lowest_price가 유효한 숫자가 아닙니다.");
//                        rowNum++;
//                        continue;
//                    }
//                    jugot.setLowestPrice(lowestPrice);
                    
                    // market 또는 market_type (선택, String) - 시장구분
                    String marketType = null;
                    if (columnMap.containsKey("market") && columnMap.get("market") < values.length) {
                        marketType = values[columnMap.get("market")].trim();
                    } else if (columnMap.containsKey("market_type") && columnMap.get("market_type") < values.length) {
                        marketType = values[columnMap.get("market_type")].trim();
                    }
                    if (marketType != null && !marketType.isEmpty()) {
                        jugot.setMarketType(marketType);
                    }
                    
                    // 중복 검사: 포착일과 종목명이 같은 데이터가 이미 DB에 있는지 확인
                    Optional<Jugot> existing = repository.findByStockNameAndCaptureDate(
                        jugot.getStockName(), jugot.getCaptureDate());
                    if (existing.isPresent()) {
                        Map<String, Object> failedRow = new HashMap<>();
                        failedRow.put("row", rowNum + 1);
                        failedRow.put("stockName", stockNameForError);
                        failedRow.put("reason", "중복된 데이터입니다. (종목명: " + jugot.getStockName() + 
                            ", 포착일: " + jugot.getCaptureDate() + "가 이미 존재합니다)");
                        failedRows.add(failedRow);
                        errors.add((rowNum + 1) + "번째 행: 중복된 데이터입니다. (종목명: " + jugot.getStockName() + 
                            ", 포착일: " + jugot.getCaptureDate() + ")");
                        rowNum++;
                        continue;
                    }
                    
                    // 같은 파일 내에서도 중복 체크 (같은 파일에 같은 종목명+포착일이 여러 개 있는 경우)
                    boolean isDuplicateInFile = false;
                    for (Jugot existingJugot : validJugots) {
                        if (existingJugot.getStockName().equals(jugot.getStockName()) && 
                            existingJugot.getCaptureDate().equals(jugot.getCaptureDate())) {
                            isDuplicateInFile = true;
                            break;
                        }
                    }
                    if (isDuplicateInFile) {
                        Map<String, Object> failedRow = new HashMap<>();
                        failedRow.put("row", rowNum + 1);
                        failedRow.put("stockName", stockNameForError);
                        failedRow.put("reason", "파일 내 중복된 데이터입니다. (종목명: " + jugot.getStockName() + 
                            ", 포착일: " + jugot.getCaptureDate() + ")");
                        failedRows.add(failedRow);
                        errors.add((rowNum + 1) + "번째 행: 파일 내 중복된 데이터입니다. (종목명: " + jugot.getStockName() + 
                            ", 포착일: " + jugot.getCaptureDate() + ")");
                        rowNum++;
                        continue;
                    }
                    
                    validJugots.add(jugot);
                    
                } catch (Exception e) {
                    Map<String, Object> failedRow = new HashMap<>();
                    failedRow.put("row", rowNum + 1);
                    failedRow.put("stockName", stockNameForError != null ? stockNameForError : "(없음)");
                    failedRow.put("reason", "처리 중 오류: " + e.getMessage());
                    failedRows.add(failedRow);
                    errors.add((rowNum + 1) + "번째 행 처리 중 오류: " + e.getMessage());
                }
                
                rowNum++;
            }
            
            reader.close();
            
            // 유효성 검증 결과
            int successCount = validJugots.size();
            int failCount = failedRows.size();
            
            result.put("totalRows", totalRows);
            result.put("successCount", successCount);
            result.put("failCount", failCount);
            result.put("failedRows", failedRows);
            
            if (!errors.isEmpty()) {
                result.put("success", false);
                result.put("errors", errors);
                result.put("validCount", successCount);
                return result;
            }
            
            // 모든 데이터가 유효하면 DB에 저장
            repository.saveAll(validJugots);
            
            result.put("success", true);
            result.put("message", totalRows + "건 중 " + successCount + "건 성공적으로 업로드되었습니다.");
            result.put("uploadedCount", successCount);
            
        } catch (Exception e) {
            errors.add("CSV 파일 처리 중 오류가 발생했습니다: " + e.getMessage());
            result.put("success", false);
            result.put("errors", errors);
        }
        
        return result;
    }
    
    // CSV 라인 파싱 (쉼표로 구분, 따옴표 처리)
    private String[] parseCSVLine(String line) {
        List<String> result = new ArrayList<>();
        boolean inQuotes = false;
        StringBuilder current = new StringBuilder();
        
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            
            if (c == '"') {
                if (inQuotes && i + 1 < line.length() && line.charAt(i + 1) == '"') {
                    // 이스케이프된 따옴표
                    current.append('"');
                    i++;
                } else {
                    // 따옴표 시작/끝
                    inQuotes = !inQuotes;
                }
            } else if (c == ',' && !inQuotes) {
                // 필드 구분자
                result.add(current.toString());
                current = new StringBuilder();
            } else {
                current.append(c);
            }
        }
        result.add(current.toString()); // 마지막 필드
        
        return result.toArray(new String[0]);
    }
    
    // CSV 값에서 Integer 파싱
    private Integer parseInteger(String[] values, Integer columnIndex) {
        if (columnIndex == null || columnIndex >= values.length) {
            return null;
        }
        try {
            String value = values[columnIndex].trim();
            if (value.isEmpty()) return null;
            // 소수점 제거
            if (value.contains(".")) {
                value = value.substring(0, value.indexOf("."));
            }
            return Integer.parseInt(value);
        } catch (Exception e) {
            return null;
        }
    }
    
    // CSV 값에서 LocalDate 파싱
    private LocalDate parseDate(String[] values, Integer columnIndex) {
        if (columnIndex == null || columnIndex >= values.length) {
            return null;
        }
        String value = values[columnIndex].trim();
        if (value.isEmpty()) return null;
        
        // 다양한 날짜 형식 시도
        String[] dateFormats = {
            "yyyy-MM-dd", "yyyy/MM/dd", "yyyyMMdd",
            "yyyy.MM.dd", "MM/dd/yyyy", "dd/MM/yyyy"
        };
        
        for (String format : dateFormats) {
            try {
                return LocalDate.parse(value, DateTimeFormatter.ofPattern(format));
            } catch (DateTimeParseException e) {
                // 다음 형식 시도
            }
        }
        
        // 숫자 형식도 시도
        if (value.length() == 8 && value.matches("\\d+")) {
            try {
                return LocalDate.parse(value, DateTimeFormatter.ofPattern("yyyyMMdd"));
            } catch (DateTimeParseException e) {
                // 무시
            }
        }
        
        return null;
    }

    // 종목 검색 (종목명으로 검색)
    public List<Map<String, Object>> searchStocks(String keyword) {
        List<Object[]> results = repository.findDistinctStockNameAndCodeByStockNameContaining(keyword);
        List<Map<String, Object>> stocks = new ArrayList<>();
        
        for (Object[] result : results) {
            String stockCode = (String) result[1];
            Map<String, Object> stock = new HashMap<>();
            stock.put("stockName", (String) result[0]);
            stock.put("stockCode", stockCode);
            
            // 해당 종목의 최신 currentPrice 조회 (stockCode를 6자리로 패딩)
            String paddedStockCode = padStockCode(stockCode);
            List<Jugot> latestJugots = repository.findByStockCodeOrderByCaptureDateDesc(paddedStockCode);
            
            Integer currentPrice = null;
            if (!latestJugots.isEmpty()) {
                // currentPrice가 null이 아니고 0보다 큰 경우만 사용
                for (Jugot jugot : latestJugots) {
                    Integer price = jugot.getCurrentPrice();
                    if (price != null && price > 0) {
                        currentPrice = price;
                        break;
                    }
                }
            }
            stock.put("currentPrice", currentPrice);
            
            stocks.add(stock);
        }
        
        return stocks;
    }
    
    // 최근 종목 목록 조회
    public List<Map<String, Object>> getRecentStocks() {
        List<Object[]> results = repository.findDistinctStocksOrderByDateDesc();
        List<Map<String, Object>> stocks = new ArrayList<>();
        
        // 최대 100개까지만 반환
        int limit = Math.min(100, results.size());
        for (int i = 0; i < limit; i++) {
            Object[] result = results.get(i);
            String stockCode = (String) result[1];
            Map<String, Object> stock = new HashMap<>();
            stock.put("stockName", (String) result[0]);
            stock.put("stockCode", stockCode);
            
            // 해당 종목의 최신 currentPrice 조회 (stockCode를 6자리로 패딩)
            String paddedStockCode = padStockCode(stockCode);
            List<Jugot> latestJugots = repository.findByStockCodeOrderByCaptureDateDesc(paddedStockCode);
            
            Integer currentPrice = null;
            if (!latestJugots.isEmpty()) {
                // currentPrice가 null이 아니고 0보다 큰 경우만 사용
                for (Jugot jugot : latestJugots) {
                    Integer price = jugot.getCurrentPrice();
                    if (price != null && price > 0) {
                        currentPrice = price;
                        break;
                    }
                }
            }
            stock.put("currentPrice", currentPrice);
            
            stocks.add(stock);
        }
        
        return stocks;
    }

    // stock_code를 6자리로 패딩하는 헬퍼 메서드 (앞에 0 채우기)
    private String padStockCode(String stockCode) {
        if (stockCode == null || stockCode.isEmpty()) {
            return stockCode;
        }
        
        // 숫자로만 구성되어 있는지 확인
        if (stockCode.matches("\\d+")) {
            // 숫자인 경우 6자리로 패딩
            try {
                int codeValue = Integer.parseInt(stockCode);
                return String.format("%06d", codeValue);
            } catch (NumberFormatException e) {
                // 숫자로 변환 실패 시 원본 반환
                return stockCode;
            }
        } else {
            // 숫자가 아닌 문자가 포함된 경우, 길이가 6자리 미만이면 앞에 0을 직접 추가
            if (stockCode.length() < 6) {
                int paddingLength = 6 - stockCode.length();
                StringBuilder padded = new StringBuilder();
                for (int i = 0; i < paddingLength; i++) {
                    padded.append('0');
                }
                padded.append(stockCode);
                return padded.toString();
            }
            return stockCode;
        }
    }

    @FunctionalInterface
    interface SupplierWithEx<T> {
        T get() throws Exception;
    }
}

