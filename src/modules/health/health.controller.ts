import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
//verificar si la api esta sana
@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Verificar el estado de salud de la API' })
  @ApiResponse({ status: 200, description: 'La API se encuentra operativa.' })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('error-demo/:code')
  @ApiOperation({
    summary: 'Simular errores HTTP interactivos (Prueba de Swagger)',
    description:
      'Recibe un código de error (400, 401, 403, 404, 409) por parámetro y lanza la excepción HTTP correspondiente.',
  })
  @ApiParam({
    name: 'code',
    description: 'Código de error HTTP a simular (400, 401, 403, 404, 409)',
    type: 'string',
  })
  @ApiQuery({
    name: 'message',
    required: false,
    description: 'Mensaje de error personalizado opcional',
  })
  @ApiResponse({
    status: 200,
    description: 'No se simuló ningún error (Código no mapeado).',
  })
  @ApiResponse({
    status: 400,
    description: 'Petición incorrecta (Bad Request). Ej: Parámetros inválidos.',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado (Unauthorized). Ej: Token inválido.',
  })
  @ApiResponse({
    status: 403,
    description:
      'Prohibido (Forbidden). Ej: Permisos de rol insuficientes o sin sesión.',
  })
  @ApiResponse({
    status: 404,
    description: 'No encontrado (Not Found). Ej: Recurso inexistente.',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflicto (Conflict). Ej: Correo o registro duplicado.',
  })
  simulateError(
    @Param('code') code: string,
    @Query('message') message?: string,
  ) {
    const errorMsg = message || `Error simulado para el código ${code}`;
    const statusCode = Number.parseInt(code, 10);

    if (statusCode === 400) {
      throw new HttpException(
        { success: false, error: 'Bad Request', message: errorMsg },
        HttpStatus.BAD_REQUEST,
      );
    }
    if (statusCode === 401) {
      throw new HttpException(
        { success: false, error: 'Unauthorized', message: errorMsg },
        HttpStatus.UNAUTHORIZED,
      );
    }
    if (statusCode === 403) {
      throw new HttpException(
        { success: false, error: 'Forbidden', message: errorMsg },
        HttpStatus.FORBIDDEN,
      );
    }
    if (statusCode === 404) {
      throw new HttpException(
        { success: false, error: 'Not Found', message: errorMsg },
        HttpStatus.NOT_FOUND,
      );
    }
    if (statusCode === 409) {
      throw new HttpException(
        { success: false, error: 'Conflict', message: errorMsg },
        HttpStatus.CONFLICT,
      );
    }

    return {
      success: true,
      message: `Código ${code} no provocó error. Retornado con éxito.`,
    };
  }
}
