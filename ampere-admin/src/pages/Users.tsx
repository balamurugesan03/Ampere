import { useNavigate } from 'react-router-dom';
import { Users as UsersIcon, Share2, Ban, CheckCircle2, Trophy } from 'lucide-react';
import { useAdminUsers, useUpdateAdminUser } from '../api/hooks';
import { Avatar, Badge, Button, PageHeader, Spinner, EmptyState, Table, Th, Td, Tr } from '../components/ui';

export default function Users() {
  const { data: users = [], isLoading } = useAdminUsers();
  const updateUser = useUpdateAdminUser();
  const navigate = useNavigate();

  return (
    <div>
      <PageHeader title="Users" icon={UsersIcon} description="Every distributor and customer in your network." />

      {isLoading ? (
        <Spinner label="Loading users..." />
      ) : users.length === 0 ? (
        <EmptyState icon={UsersIcon} title="No customers yet" />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Referral Code</Th>
              <Th>Rank</Th>
              <Th>Wallet</Th>
              <Th>Status</Th>
              <Th align="right"></Th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <Tr key={user._id}>
                <Td>
                  <div className="flex items-center gap-2.5">
                    <Avatar name={user.name} size={30} />
                    <div>
                      <p className="text-fg font-medium">{user.name}</p>
                      <p className="text-subtle text-xs">{user.email}</p>
                    </div>
                  </div>
                </Td>
                <Td className="text-muted">{user.referralCode}</Td>
                <Td>
                  {user.currentRank ? (
                    <span className="inline-flex items-center gap-1.5 text-fg">
                      <Trophy size={13} className="text-warning" />
                      {user.currentRank}
                    </span>
                  ) : (
                    <span className="text-subtle">—</span>
                  )}
                </Td>
                <Td className="text-fg font-medium">₹{user.walletBalance ?? 0}</Td>
                <Td>
                  <Badge tone={user.isBlocked ? 'red' : 'green'}>{user.isBlocked ? 'Blocked' : 'Active'}</Badge>
                </Td>
                <Td align="right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="secondary" icon={Share2} onClick={() => navigate(`/network/${user._id}`)}>
                      Network
                    </Button>
                    <Button
                      size="sm"
                      variant={user.isBlocked ? 'secondary' : 'danger'}
                      icon={user.isBlocked ? CheckCircle2 : Ban}
                      onClick={() => updateUser.mutate({ id: user._id, isBlocked: !user.isBlocked })}
                    >
                      {user.isBlocked ? 'Unblock' : 'Block'}
                    </Button>
                  </div>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
