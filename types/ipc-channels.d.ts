/**
 * Типы для IPC каналов
 */

export interface IpcChannels {
    PROJECTS: {
        GET_ALL: string;
        GET_BY_ID: string;
        CREATE: string;
        UPDATE: string;
        DELETE: string;
        GET_STATS: string;
    };
    EMPLOYEES: {
        GET_ALL: string;
        GET_BY_ID: string;
        CREATE: string;
        UPDATE: string;
        DELETE: string;
        GET_STATS: string;
    };
    MATERIALS: {
        GET_ALL: string;
        GET_BY_ID: string;
        CREATE: string;
        UPDATE: string;
        DELETE: string;
        GET_STATS: string;
    };
    WORK_LOG: {
        GET_ALL: string;
        CREATE: string;
        UPDATE: string;
        DELETE: string;
    };
    MATERIAL_LOG: {
        GET_ALL: string;
        CREATE: string;
        UPDATE: string;
        DELETE: string;
    };
    PROJECT_PAYMENTS: {
        GET_ALL: string;
        CREATE: string;
        UPDATE: string;
        DELETE: string;
        GET_TOTAL_BY_PROJECT: string;
    };
    REPORTS: {
        GET_ALL_PROJECTS: string;
        GET_ALL_EMPLOYEES: string;
        GET_ALL_MATERIALS: string;
        GET_OVERALL_STATS: string;
    };
    BACKUP: {
        EXPORT: string;
        EXPORT_TO_EXE_DIR: string;
        IMPORT: string;
        IMPORT_FROM_FILE: string;
        CREATE_AUTO_BACKUP: string;
        GET_BACKUP_LIST: string;
        DELETE_BACKUP: string;
        GET_EXE_DIRECTORY: string;
        CLEANUP_OLD_FILES: string;
    };
    DIALOG: {
        SHOW_OPEN_DIALOG: string;
        SHOW_SAVE_DIALOG: string;
    };
}


