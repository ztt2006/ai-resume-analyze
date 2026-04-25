from __future__ import annotations

import logging
from http import HTTPStatus
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.responses import error_response


logger = logging.getLogger(__name__)


class AppException(Exception):
    """Base application exception."""

    def __init__(
        self,
        message: str,
        status_code: int = HTTPStatus.BAD_REQUEST,
        code: int = 4000,
        data: Any = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.code = code
        self.data = data


class FileValidationException(AppException):
    def __init__(self, message: str = "仅支持上传 PDF 文件") -> None:
        super().__init__(message=message, status_code=HTTPStatus.BAD_REQUEST, code=4001)


class PDFParseException(AppException):
    def __init__(self, message: str = "PDF 解析失败") -> None:
        super().__init__(message=message, status_code=HTTPStatus.UNPROCESSABLE_ENTITY, code=4002)


class AIServiceException(AppException):
    def __init__(self, message: str = "AI 服务调用失败") -> None:
        super().__init__(message=message, status_code=HTTPStatus.BAD_GATEWAY, code=5001)


class DatabaseOperationException(AppException):
    def __init__(self, message: str = "数据库操作失败") -> None:
        super().__init__(message=message, status_code=HTTPStatus.INTERNAL_SERVER_ERROR, code=5002)


class NotFoundException(AppException):
    def __init__(self, message: str = "资源不存在") -> None:
        super().__init__(message=message, status_code=HTTPStatus.NOT_FOUND, code=4040)


def register_exception_handlers(app: FastAPI) -> None:
    """Register global exception handlers."""

    @app.exception_handler(AppException)
    async def handle_app_exception(_: Request, exc: AppException) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content=error_response(message=exc.message, code=exc.code, data=exc.data),
        )

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
        details = [{"loc": list(item["loc"]), "msg": item["msg"]} for item in exc.errors()]
        return JSONResponse(
            status_code=HTTPStatus.UNPROCESSABLE_ENTITY,
            content=error_response(message="请求参数校验失败", code=4220, data=details),
        )

    @app.exception_handler(StarletteHTTPException)
    async def handle_http_exception(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content=error_response(message=str(exc.detail), code=exc.status_code * 10),
        )

    @app.exception_handler(Exception)
    async def handle_unexpected_exception(_: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled exception: %s", exc)
        return JSONResponse(
            status_code=HTTPStatus.INTERNAL_SERVER_ERROR,
            content=error_response(message="服务器内部异常", code=5000),
        )
