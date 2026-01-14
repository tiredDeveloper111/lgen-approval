#!/bin/bash

###############################################################################
# 결재상태 처리 SOAP 클라이언트 (Bash Script)
# 
# 사용법:
#   ./test-soap-client.sh <호스트> <포트> <JSON파일경로>
#
# 예시:
#   ./test-soap-client.sh localhost 8081 ./test-requests/approve-test.json
#   ./test-soap-client.sh 10.94.23.4 8081 ./test-requests/reject-test.json
###############################################################################

set -e  # 에러 발생 시 즉시 종료

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 사용법 출력
print_usage() {
    echo "결재상태 처리 SOAP 테스트 클라이언트 (Bash)"
    echo ""
    echo "사용법:"
    echo "  $0 <호스트> <포트> <JSON파일경로>"
    echo ""
    echo "예시:"
    echo "  $0 localhost 8081 ./test-requests/approve-test.json"
    echo "  $0 10.94.23.4 8081 ./test-requests/reject-test.json"
    echo "  $0 dev-server.example.com 8081 /path/to/test.json"
    echo ""
    echo "필수 도구:"
    echo "  - curl: HTTP 요청 전송"
    echo "  - jq: JSON 파싱"
    echo "  - xmllint: XML 파싱 (libxml2-utils 패키지)"
    echo ""
    echo "설치 방법 (Ubuntu/Debian):"
    echo "  sudo apt-get install -y curl jq libxml2-utils"
}

# 필수 도구 확인
check_dependencies() {
    local missing=0
    
    if ! command -v curl &> /dev/null; then
        echo -e "${RED}❌ curl이 설치되어 있지 않습니다.${NC}"
        echo "   설치: sudo apt-get install -y curl"
        missing=1
    fi
    
    if ! command -v jq &> /dev/null; then
        echo -e "${RED}❌ jq가 설치되어 있지 않습니다.${NC}"
        echo "   설치: sudo apt-get install -y jq"
        missing=1
    fi
    
    if ! command -v xmllint &> /dev/null; then
        echo -e "${YELLOW}⚠️  xmllint가 설치되어 있지 않습니다. (선택사항)${NC}"
        echo "   설치: sudo apt-get install -y libxml2-utils"
    fi
    
    if [ $missing -eq 1 ]; then
        exit 1
    fi
}

# JSON 필드를 안전하게 읽기 (이스케이프 처리)
json_get() {
    local json_file=$1
    local field=$2
    jq -r ".${field}" "$json_file"
}

# XML 이스케이프
xml_escape() {
    echo "$1" | sed 's/&/\&amp;/g; s/</\&lt;/g; s/>/\&gt;/g; s/"/\&quot;/g; s/'"'"'/\&apos;/g'
}

# SOAP XML 생성
generate_soap_xml() {
    local json_file=$1
    
    # JSON에서 필드 읽기
    local api_type=$(json_get "$json_file" "API_TYPE")
    local system_id=$(json_get "$json_file" "SYSTEM_ID")
    local appkey_01=$(json_get "$json_file" "APPKEY_01")
    local appkey_02=$(json_get "$json_file" "APPKEY_02")
    local appkey_03=$(json_get "$json_file" "APPKEY_03")
    local appkey_04=$(json_get "$json_file" "APPKEY_04")
    local appkey_05=$(json_get "$json_file" "APPKEY_05")
    local appkey_06=$(json_get "$json_file" "APPKEY_06")
    local approver=$(json_get "$json_file" "APPROVER")
    local comment_utf8=$(json_get "$json_file" "COMMENT_UTF8")
    local comment_euckr=$(json_get "$json_file" "COMMENT_EUCKR")
    local result=$(json_get "$json_file" "RESULT")
    local next_appr_type=$(json_get "$json_file" "NEXT_APPR_TYPE")
    local next_approver_order=$(json_get "$json_file" "NEXT_APPROVER_ORDER")
    local next_approver=$(json_get "$json_file" "NEXT_APPROVER")
    local read_user=$(json_get "$json_file" "READ_USER")
    local appr_date=$(json_get "$json_file" "APPR_DATE")
    
    # XML 이스케이프
    api_type=$(xml_escape "$api_type")
    system_id=$(xml_escape "$system_id")
    appkey_01=$(xml_escape "$appkey_01")
    comment_utf8=$(xml_escape "$comment_utf8")
    result=$(xml_escape "$result")
    
    # SOAP XML 생성
    cat <<EOF
<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:p1="http://www.lgchem.com/ApprovalStatus">
  <soap:Body>
    <p1:processApprovalStatus>
      <API_TYPE>$api_type</API_TYPE>
      <SYSTEM_ID>$system_id</SYSTEM_ID>
      <APPKEY_01>$appkey_01</APPKEY_01>
      <APPKEY_02>$appkey_02</APPKEY_02>
      <APPKEY_03>$appkey_03</APPKEY_03>
      <APPKEY_04>$appkey_04</APPKEY_04>
      <APPKEY_05>$appkey_05</APPKEY_05>
      <APPKEY_06>$appkey_06</APPKEY_06>
      <APPROVER>$approver</APPROVER>
      <COMMENT_UTF8>$comment_utf8</COMMENT_UTF8>
      <COMMENT_EUCKR>$comment_euckr</COMMENT_EUCKR>
      <RESULT>$result</RESULT>
      <NEXT_APPR_TYPE>$next_appr_type</NEXT_APPR_TYPE>
      <NEXT_APPROVER_ORDER>$next_approver_order</NEXT_APPROVER_ORDER>
      <NEXT_APPROVER>$next_approver</NEXT_APPROVER>
      <READ_USER>$read_user</READ_USER>
      <APPR_DATE>$appr_date</APPR_DATE>
    </p1:processApprovalStatus>
  </soap:Body>
</soap:Envelope>
EOF
}

# SOAP 요청 전송
send_soap_request() {
    local host=$1
    local port=$2
    local soap_xml=$3
    local endpoint="http://${host}:${port}/approval-status"
    
    # 임시 파일 생성
    local temp_response=$(mktemp)
    local temp_headers=$(mktemp)
    
    # curl로 SOAP 요청 전송
    local http_status=$(curl -s -w "%{http_code}" \
        -o "$temp_response" \
        -D "$temp_headers" \
        -X POST \
        -H "Content-Type: text/xml; charset=utf-8" \
        -H "SOAPAction: \"\"" \
        -d "$soap_xml" \
        "$endpoint")
    
    local body=$(cat "$temp_response")
    
    # 임시 파일 삭제
    rm -f "$temp_response" "$temp_headers"
    
    echo "$http_status:$body"
}

# XML 응답 파싱
parse_soap_response() {
    local response=$1
    
    # xmllint가 있으면 사용, 없으면 grep/sed 사용
    if command -v xmllint &> /dev/null; then
        local if_status=$(echo "$response" | xmllint --xpath "string(//*[local-name()='IF_STATUS'])" - 2>/dev/null || echo "")
        local if_errmsg=$(echo "$response" | xmllint --xpath "string(//*[local-name()='IF_ERRMSG'])" - 2>/dev/null || echo "")
    else
        local if_status=$(echo "$response" | grep -oP '(?<=<IF_STATUS>)[^<]+' || echo "")
        local if_errmsg=$(echo "$response" | grep -oP '(?<=<IF_ERRMSG>)[^<]+' || echo "")
    fi
    
    echo "$if_status|$if_errmsg"
}

# 메인 함수
main() {
    echo "========================================"
    echo "결재상태 처리 SOAP 클라이언트 테스트"
    echo "========================================"
    echo ""
    
    # 인자 확인
    if [ "$1" == "-h" ] || [ "$1" == "--help" ]; then
        print_usage
        exit 0
    fi
    
    if [ $# -ne 3 ]; then
        echo -e "${RED}❌ 오류: 인자가 부족합니다.${NC}"
        echo ""
        print_usage
        exit 1
    fi
    
    local host=$1
    local port=$2
    local json_file=$3
    
    # 의존성 확인
    check_dependencies
    
    # JSON 파일 존재 확인
    if [ ! -f "$json_file" ]; then
        echo -e "${RED}❌ 오류: JSON 파일을 찾을 수 없습니다: $json_file${NC}"
        exit 1
    fi
    
    # JSON 유효성 검사
    if ! jq empty "$json_file" 2>/dev/null; then
        echo -e "${RED}❌ 오류: 유효하지 않은 JSON 파일입니다.${NC}"
        exit 1
    fi
    
    # 서버 정보 출력
    echo -e "${BLUE}🌐 서버 정보:${NC}"
    echo "   Host: $host"
    echo "   Port: $port"
    echo "   Path: /approval-status"
    echo ""
    
    # JSON 파일 정보 출력
    echo -e "${BLUE}📄 요청 파일:${NC}"
    echo "   파일: $json_file"
    echo ""
    
    # 요청 데이터 출력
    echo -e "${BLUE}📋 요청 데이터:${NC}"
    jq . "$json_file"
    echo ""
    
    # SOAP XML 생성
    local soap_xml=$(generate_soap_xml "$json_file")
    
    # 디버그: SOAP XML 출력 (선택사항)
    if [ "$DEBUG" == "1" ]; then
        echo -e "${YELLOW}[DEBUG] SOAP XML:${NC}"
        echo "$soap_xml"
        echo ""
    fi
    
    # SOAP 요청 전송
    local result=$(send_soap_request "$host" "$port" "$soap_xml")
    
    # HTTP 상태 코드와 본문 분리
    local http_status=$(echo "$result" | cut -d':' -f1)
    local response_body=$(echo "$result" | cut -d':' -f2-)
    
    echo -e "${BLUE}📥 응답 수신:${NC}"
    echo "   HTTP Status: $http_status"
    echo ""
    
    # 응답 본문 출력
    if [ "$http_status" -ne 200 ]; then
        echo -e "${RED}❌ HTTP 오류 (상태 코드: $http_status)${NC}"
        echo ""
        echo "응답 본문:"
        echo "$response_body"
        exit 1
    fi
    
    # XML 응답 파싱
    local parsed=$(parse_soap_response "$response_body")
    local if_status=$(echo "$parsed" | cut -d'|' -f1)
    local if_errmsg=$(echo "$parsed" | cut -d'|' -f2)
    
    # 응답 데이터 출력
    echo "응답 데이터:"
    echo "  IF_STATUS: $if_status"
    echo "  IF_ERRMSG: $if_errmsg"
    echo ""
    
    # 디버그: 전체 XML 응답 출력 (선택사항)
    if [ "$DEBUG" == "1" ]; then
        echo -e "${YELLOW}[DEBUG] 전체 XML 응답:${NC}"
        if command -v xmllint &> /dev/null; then
            echo "$response_body" | xmllint --format -
        else
            echo "$response_body"
        fi
        echo ""
    fi
    
    # 결과 판정
    echo "========================================"
    if [ "$if_status" == "S" ]; then
        echo -e "${GREEN}✅ 테스트 성공: $if_errmsg${NC}"
        exit 0
    else
        echo -e "${RED}❌ 테스트 실패: $if_errmsg${NC}"
        exit 1
    fi
}

# 스크립트 실행
main "$@"

