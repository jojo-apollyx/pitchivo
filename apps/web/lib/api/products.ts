import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient, queryKeys } from './client'
import { productsResponseSchema, createProductSchema, updateProductSchema, type Product, type CreateProductInput, type UpdateProductInput } from './schemas'

/**
 * TanStack Query hooks for products API
 * Automatically handles caching, refetching, and error states
 */

// Fetch products list
export function useProducts() {
  return useQuery({
    queryKey: queryKeys.products.lists(),
    queryFn: async () => {
      const data = await apiClient<{ products: Product[] }>('/api/products')
      return productsResponseSchema.parse(data) // Zod validation
    },
  })
}

// Fetch single product
export function useProduct(id: string) {
  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: async () => {
      const data = await apiClient<Product>(`/api/products/${id}`)
      return data
    },
    enabled: !!id, // Only fetch if ID exists
  })
}

// Create product mutation
export function useCreateProduct() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (input: CreateProductInput) => {
      // Validate input with Zod before sending
      const validated = createProductSchema.parse(input)
      return apiClient<{ product: Product; context?: { isImpersonating: boolean } }>('/api/products', {
        method: 'POST',
        body: JSON.stringify(validated),
      })
    },
    onSuccess: () => {
      // Invalidate products list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() })
    },
  })
}

// Update product mutation
export function useUpdateProduct(id: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (input: UpdateProductInput) => {
      const validated = updateProductSchema.parse(input)
      return apiClient<Product>(`/api/products/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(validated),
      })
    },
    onSuccess: () => {
      // Invalidate both list and detail
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() })
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(id) })
    },
  })
}

// Delete product mutation
export function useDeleteProduct() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient<void>(`/api/products/${id}`, {
        method: 'DELETE',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() })
    },
  })
}

