import { useNavigate, useParams } from 'react-router-dom';
import { Share2, Users2 } from 'lucide-react';
import { useAdminUsers, useUserDownline } from '../api/hooks';
import { Avatar, Card, PageHeader, Select, Spinner, EmptyState, Table, Th, Td, Tr } from '../components/ui';

export default function Network() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { data: users = [] } = useAdminUsers();
  const { data, isLoading } = useUserDownline(userId);

  const rootUser = users.find((u) => u._id === userId);

  return (
    <div>
      <PageHeader title="Network" icon={Share2} description="Drill into any distributor's full downline tree." />

      <Card className="max-w-sm mb-6">
        <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
          View downline for
        </label>
        <Select value={userId ?? ''} onChange={(e) => navigate(`/network/${e.target.value}`)}>
          <option value="" disabled>
            Select a customer
          </option>
          {users.map((u) => (
            <option key={u._id} value={u._id}>
              {u.name} ({u.referralCode})
            </option>
          ))}
        </Select>
      </Card>

      {!userId ? (
        <EmptyState icon={Users2} title="Pick a customer above" description="Their downline tree will appear here." />
      ) : isLoading ? (
        <Spinner label="Loading downline..." />
      ) : (
        <Table>
          <thead>
            <tr>
              <td colSpan={6} className="px-4 py-3 border-b border-border bg-surface-2/60 text-sm font-semibold text-fg">
                {rootUser?.name ?? 'This user'}'s downline — {data?.totalCount ?? 0} people across all levels
              </td>
            </tr>
            <tr>
              <Th>Level</Th>
              <Th>Name</Th>
              <Th>Referral Code</Th>
              <Th>Team Size</Th>
              <Th>Wallet</Th>
              <Th>Joined</Th>
            </tr>
          </thead>
          <tbody>
            {(data?.downline.length ?? 0) === 0 && (
              <tr>
                <td colSpan={6}>
                  <EmptyState icon={Users2} title="No downline yet" />
                </td>
              </tr>
            )}
            {data?.downline.map((u) => (
              <Tr key={u._id}>
                <Td>
                  <span className="text-xs font-bold text-accent bg-accent-soft border border-accent-border rounded-md px-1.5 py-0.5">
                    L{u.level}
                  </span>
                </Td>
                <Td>
                  <div className="flex items-center gap-2.5">
                    <Avatar name={u.name} size={28} />
                    <span className="text-fg font-medium">{u.name}</span>
                  </div>
                </Td>
                <Td className="text-muted">{u.referralCode}</Td>
                <Td className="text-fg">{u.teamSize}</Td>
                <Td className="text-fg font-medium">₹{u.walletBalance}</Td>
                <Td className="text-muted">{new Date(u.createdAt).toLocaleDateString()}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
