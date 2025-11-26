/**
 * Extrai a mensagem de erro da resposta do backend
 * O backend retorna erros no formato: { error: { type: string, message: string | Record<string, string> } }
 */
export function getErrorMessage(error: any, defaultMessage: string = "Ocorreu um erro inesperado"): string {
  // Se não há erro, retorna mensagem padrão
  if (!error) {
    return defaultMessage;
  }

  // Tenta extrair a mensagem do formato do backend
  // O axios coloca a resposta em error.response.data
  const responseData = error?.response?.data;
  
  // Primeiro tenta pegar do formato padrão do backend: { error: { message: ... } }
  if (responseData?.error) {
    const backendError = responseData.error;
    const message = backendError.message;
    
    // Se a mensagem é um objeto (erros de validação), formata as mensagens
    if (typeof message === 'object' && message !== null && !Array.isArray(message)) {
      const errorMessages = Object.entries(message)
        .map(([field, msg]) => `${field}: ${msg}`)
        .join('; ');
      return errorMessages || defaultMessage;
    }
    
    // Se a mensagem é uma string, retorna ela
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }

  // Tenta pegar mensagem diretamente de response.data se não estiver no formato padrão
  if (responseData?.message && typeof responseData.message === 'string') {
    return responseData.message;
  }

  // Se há uma mensagem no erro direto (pode ser do axios)
  if (error?.message && typeof error.message === 'string') {
    // Ignora mensagens genéricas do axios
    if (error.message.includes('Request failed') || error.message.includes('status code')) {
      // Não retorna essa mensagem genérica, vai para o fallback baseado no status
    } else {
      return error.message;
    }
  }

  // Se há um status code, retorna mensagem baseada nele
  const status = error?.response?.status;
  if (status) {
    switch (status) {
      case 400:
        return "Requisição inválida. Verifique os dados enviados.";
      case 401:
        // Para 401, tenta pegar a mensagem do backend primeiro
        if (responseData?.error?.message && typeof responseData.error.message === 'string') {
          return responseData.error.message;
        }
        return "Email ou senha incorretos.";
      case 403:
        return "Acesso negado. Você não tem permissão para esta ação.";
      case 404:
        return "Recurso não encontrado.";
      case 422:
        return "Dados inválidos. Verifique os campos preenchidos.";
      case 500:
        return "Erro interno do servidor. Tente novamente mais tarde.";
      default:
        return `Erro na requisição (${status}). ${defaultMessage}`;
    }
  }

  // Se não há conexão com o servidor
  if (error?.code === 'ECONNABORTED' || error?.code === 'ERR_NETWORK') {
    return "Não foi possível conectar ao servidor. Verifique sua conexão.";
  }

  // Retorna mensagem padrão
  return defaultMessage;
}

