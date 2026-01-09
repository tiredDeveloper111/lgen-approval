import * as soap from 'soap';
// import * as path from 'path';

async function testSoapClient() {
  try {
    // 목업 서버 WSDL URL
    const wsdlUrl = 'http://localhost:8000/soap?wsdl';

    // 목업 서버 엔드포인트 (WSDL에 정의된 엔드포인트 대신 사용)
    const endpoint = 'http://localhost:8000/soap';

    console.log('SOAP 클라이언트 생성 중...');
    const client = await soap.createClientAsync(wsdlUrl, {
      endpoint: endpoint,
    });

    console.log('사용 가능한 서비스:');
    console.log(client.describe());

    // 요청 데이터 생성
    const requestData = {
      MT_LGCY_APRV_EA_TOTALAPRV_03_S: {
        requestAuto: [
          {
            SYSTEM_ID: 'TEST_SYSTEM',
            APPKEY_01: 'TEST_KEY_01',
            APPR_TITLE: '테스트 결재 요청',
            REQ_USER: 'testuser',
            FORM_ID: 'FORM_001',
            FORM_EDITOR_DATA: '<p>결재 내용</p>',
            APPR_SECURITY_TYPE: 'NORMAL',
            NEXT_APPR_TYPE: 'USER',
            NEXT_APPROVER: 'approver001',
            FORM_DATA: JSON.stringify({
              key1: 'value1',
              key2: 'value2',
            }),
          },
        ],
      },
    };

    console.log('SOAP 요청 전송 중...');
    console.log(JSON.stringify(requestData, null, 2));

    // 요청 전송
    const [result] = await client.LGCY_APRV_EA_TOTALAPRV_03_SOAsync(requestData);

    console.log('응답 결과:');
    console.log(JSON.stringify(result, null, 2));

    // 응답 확인
    console.log('응답 구조:');
    console.log(Object.keys(result));

    // 응답 상태 확인
    const response = result.MT_LGCY_APRV_EA_TOTALAPRV_03_S_response;
    if (response && response.requestAutoResponse) {
      console.log('응답 상세 내용:');
      console.log(JSON.stringify(response.requestAutoResponse, null, 2));

      if (response.requestAutoResponse.length > 0) {
        const status = response.requestAutoResponse[0].IF_STATUS;
        if (status === 'S') {
          console.log('요청이 성공적으로 처리되었습니다.');
        } else {
          console.log('요청 처리 중 오류가 발생했습니다.');
          console.log('오류 메시지:', response.requestAutoResponse[0].IF_ERRMSG);
        }
      }
    } else {
      console.log('응답 구조가 예상과 다릅니다.');
    }
  } catch (error) {
    console.error('테스트 실행 중 오류 발생:', error);
  }
}

// 테스트 실행
testSoapClient().catch(console.error);
