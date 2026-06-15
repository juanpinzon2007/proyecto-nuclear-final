import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const token = localStorage.getItem('neurocommand_access_token');
  const isApiRequest = request.url.startsWith('/api/') || request.url.startsWith('http://localhost:8001/api/');
  if (!token || !isApiRequest) return next(request);
  return next(request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
