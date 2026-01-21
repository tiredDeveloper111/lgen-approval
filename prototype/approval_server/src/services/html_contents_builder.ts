import fs from 'fs';
import {
  CreateVdContents,
  DeleteVdContents,
  ExternalNetContents,
  WatingApprovalRes,
} from './vsmgmt_client';
import os from 'os';

export const enum APPROVAL_TYPE {
  CREATE_VD = 'approval.types.create-vd',
  RESET_VD = 'approval.types.reset-vd',
  DELETE_VD = 'approval.types.delete-vd',
  ACCESS_EXT_NET = 'approval.types.access-from-external-network',
}

export class HtmlContentsBuilder {
  private static toApprovalType(type: string) {
    switch (type) {
      case 'approval.types.create-vd':
        return APPROVAL_TYPE.CREATE_VD;
      case 'approval.types.reset-vd':
        return APPROVAL_TYPE.RESET_VD;
      case 'approval.types.delete-vd':
        return APPROVAL_TYPE.DELETE_VD;
      case 'approval.types.access-from-external-network':
        return APPROVAL_TYPE.ACCESS_EXT_NET;
      default:
        throw new Error(`Not supported type ${type}`);
    }
  }

  private static getHtmlPath(type: APPROVAL_TYPE) {
    switch (type) {
      case APPROVAL_TYPE.CREATE_VD:
        return process.env.NODE_ENV === 'production'
          ? '/approval-server/html/DesktopCreate.html'
          : './html/DesktopCreate.html';
      case APPROVAL_TYPE.DELETE_VD:
        return process.env.NODE_ENV === 'production'
          ? '/approval-server/html/DesktopDelete.html'
          : './html/DesktopDelete.html';
      case APPROVAL_TYPE.RESET_VD:
        return process.env.NODE_ENV === 'production'
          ? '/approval-server/html/DesktopReset.html'
          : './html/DesktopReset.html';
      case APPROVAL_TYPE.ACCESS_EXT_NET:
        return process.env.NODE_ENV === 'production'
          ? '/approval-server/html/ExternalAccess.html'
          : './html/ExternalAccess.html';
      default:
        throw new Error('Not supported approval type');
    }
  }

  public static buildContents(approval: WatingApprovalRes) {
    const type = this.toApprovalType(approval.type);

    const htmlstr = this.loadHtml(type);

    switch (type) {
      case APPROVAL_TYPE.CREATE_VD:
        return this.buildCreateVdContents(approval, htmlstr);
      case APPROVAL_TYPE.DELETE_VD:
        return this.buildDeleteVdContents(approval, htmlstr);
      case APPROVAL_TYPE.RESET_VD:
        return this.buildResetVdContents(approval, htmlstr);
      case APPROVAL_TYPE.ACCESS_EXT_NET:
        return this.buildAccessExtContents(approval, htmlstr);
    }
  }

  private static loadHtml(type: APPROVAL_TYPE) {
    const htmlPath = this.getHtmlPath(type);
    if (!fs.existsSync(htmlPath)) {
      throw new Error(`Not exist html ${htmlPath}`);
    }

    return fs.readFileSync(htmlPath).toString();
  }

  private static buildCreateVdContents(approval: WatingApprovalRes, htmlstr: string) {
    const createVdOwnDesktopContentsFormat = `              <tr>
                <td scope="col">{{VD_NAME}}</td>
                <td scope="col">{{VD_GROUP}}</td>
                <td scope="col">{{VD_OS}}</td>
                <td scope="col">{{FLAVOR_NAME}}</td>
                <td scope="col">{{DISK}}GB</td>
                <td scope="col" class="last">{{CREATE_DATE}}</td>
              </tr>`;

    const contents = approval.contents as CreateVdContents;

    const createVdOwnDesktopContents = contents.ownDesktop
      .map((info) =>
        createVdOwnDesktopContentsFormat
          .replace('{{VD_NAME}}', info.vdName)
          .replace('{{VD_OS}}', info.os)
          .replace('{{FLAVOR_NAME}}', info.flavorName)
          .replace('{{DISK}}', info.disk.toString())
          .replace('{{CREATE_DATE}}', info.createDate)
          .replace('{{VD_GROUP}}', info.vdGroupName),
      )
      .join(os.EOL);

    return htmlstr
      .replace('{{OWN_DESKTOP}}', createVdOwnDesktopContents)
      .replace('{{REASON}}', approval.reason)
      .replace('{{USER}}', `${approval.user}/${approval.userName}/${approval.userOrganization}`)
      .replace('{{NEW_VD_VDG_NAME}}', contents.vdGroupName)
      .replace('{{NEW_VD_FLAVOR}}', contents.flavorName)
      .replace('{{NEW_VD_DISK}}', contents.disk.toString())
      .replace('{{NEW_VD_EXP}}', contents.expirationDate)
      .replace('{{EXEC_DATE}}', approval.jobScheduleDate || '입력되지않음');
  }

  private static buildDeleteVdContents(approval: WatingApprovalRes, htmlstr: string) {
    const contents = approval.contents as DeleteVdContents;
    return htmlstr
      .replace('{{REASON}}', approval.reason)
      .replace('{{USER}}', `${approval.user}/${approval.userName}/${approval.userOrganization}`)
      .replace('{{DELETE_VD_NAME}}', contents.vdName)
      .replace('{{DELETE_VD_GROUP}}', contents.vdGroupName)
      .replace('{{DELETE_VD_OS}}', contents.os)
      .replace('{{DELETE_VD_FLAVOR}}', contents.flavorName)
      .replace('{{DELETE_VD_DISK}}', contents.disk.toString())
      .replace('{{DELETE_VD_CRETED_AT}}', contents.createDate);
  }

  private static buildResetVdContents(approval: WatingApprovalRes, htmlstr: string) {
    const contents = approval.contents as DeleteVdContents;
    return htmlstr
      .replace('{{REASON}}', approval.reason)
      .replace('{{USER}}', `${approval.user}/${approval.userName}/${approval.userOrganization}`)
      .replace('{{RESET_VD_NAME}}', contents.vdName)
      .replace('{{RESET_VD_GROUP}}', contents.vdGroupName)
      .replace('{{RESET_VD_OS}}', contents.os)
      .replace('{{RESET_VD_FLAVOR}}', contents.flavorName)
      .replace('{{RESET_VD_DISK}}', contents.disk.toString())
      .replace('{{RESET_VD_CRETED_AT}}', contents.createDate)
      .replace('{{EXEC_DATE}}', approval.jobScheduleDate);
  }

  private static buildAccessExtContents(approval: WatingApprovalRes, htmlstr: string) {
    const contents = approval.contents as ExternalNetContents;
    return htmlstr
      .replace('{{REASON}}', approval.reason)
      .replace('{{USER}}', `${approval.user}/${approval.userName}/${approval.userOrganization}`)
      .replace('{{START_DATE}}', contents.startDate)
      .replace('{{END_DATE}}', contents.endDate);
  }
}
