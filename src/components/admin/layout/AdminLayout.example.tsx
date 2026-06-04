/**
 * AdminLayout Example
 *
 * This example demonstrates how to use the AdminLayout component
 * to wrap admin pages with the Sidebar and Header.
 */

import AdminLayout from './AdminLayout'
import { Card, CardHeader, CardTitle, CardBody } from '../ui/Card'

export default function AdminLayoutExample() {
  return (
    <AdminLayout>
      {/* Example admin page content */}
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Example Admin Page</h1>
          <p className="text-gray-600 mt-1">This page is wrapped with AdminLayout</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Example Card</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-gray-600">The AdminLayout component provides:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
              <li>Fixed sidebar on the left (256px width)</li>
              <li>Fixed header at the top (64px height)</li>
              <li>Main content area with proper offsets</li>
              <li>Consistent padding (32px) around content</li>
              <li>Light gray background</li>
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usage in App.tsx</CardTitle>
          </CardHeader>
          <CardBody>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
              {`<Route
  path="/admin/*"
  element={
    <ProtectedRoute>
      <AdminLayout>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/header" element={<HeaderPage />} />
            {/* ... other admin routes */}
          </Routes>
        </Suspense>
      </AdminLayout>
    </ProtectedRoute>
  }
/>`}
            </pre>
          </CardBody>
        </Card>
      </div>
    </AdminLayout>
  )
}
