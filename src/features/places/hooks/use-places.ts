import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/query-keys';
import {
  createMyPlace,
  deleteMyPlace,
  fetchMyPlaces,
  fetchPendingPlaces,
  fetchPublicPlaces,
  reviewPlace,
  type NewUserPlace,
  type UserPlace,
} from '../api/places.repository';

export function useMyPlaces(enabled = true) {
  return useQuery({ queryKey: queryKeys.places.mine, queryFn: fetchMyPlaces, enabled });
}

export function useCreatePlace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewUserPlace) => createMyPlace(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.places.mine }),
  });
}

export function useDeletePlace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (place: UserPlace) => deleteMyPlace(place),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.places.mine }),
  });
}

export function usePublicPlaces() {
  return useQuery({
    queryKey: queryKeys.places.public,
    queryFn: fetchPublicPlaces,
    staleTime: 1000 * 60 * 10,
  });
}

export function usePendingPlaces() {
  return useQuery({ queryKey: queryKeys.places.pending, queryFn: fetchPendingPlaces });
}

export function useReviewPlace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'approved' | 'rejected' }) =>
      reviewPlace(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.places.pending });
      void queryClient.invalidateQueries({ queryKey: queryKeys.places.public });
    },
  });
}
