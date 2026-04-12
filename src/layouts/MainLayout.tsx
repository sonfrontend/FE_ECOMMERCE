import React, { useState } from 'react';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UploadOutlined,
  UserOutlined,
  VideoCameraOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import { Avatar, Button, Dropdown, Flex, Layout, Menu } from 'antd';
import type { MenuProps } from 'antd';
import Trello from '@/assets/images/trello.svg';
import Header from '@/components/Header/Header';

const { Sider, Content } = Layout;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);

  const profileItems: MenuProps['items'] = [
    {
      key: 'manage',
      label: 'Quản lý',
      icon: <UserOutlined />,
      danger: true,
      onClick: () => {
        window.location.href = '/manage';
      }
    },
    {
      key: 'logout',
      label: 'Đăng xuất',
      icon: <LogoutOutlined />,
      danger: true,
      onClick: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userInfo');
        window.location.href = '/login';
      }
    }
  ];

  return (
    <div>
      <Layout className='w-full'>
        <Sider trigger={null} collapsible collapsed={collapsed} className='bg-secondary! h-screen'>
          <div />
          <Flex gap={5} justify='center' align='center' className='h-[64px]'>
            <img src={Trello} alt='' className='w-[30px]' />
            {!collapsed && <h3 className='font-bold'>TRELLO</h3>}
          </Flex>
          <Menu
            mode='inline'
            defaultSelectedKeys={['1']}
            items={[
              {
                key: '1',
                icon: <UserOutlined />,
                label: 'nav 1'
              },
              {
                key: '2',
                icon: <VideoCameraOutlined />,
                label: 'nav 2'
              },
              {
                key: '3',
                icon: <UploadOutlined />,
                label: 'nav 3'
              }
            ]}
          />
        </Sider>
        <Layout className='h-screen'>
          <div className='w-full sticky top-0 z-50'>
            <Header>
              <Button
                type='text'
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{
                  fontSize: '20px',
                  width: 64,
                  height: 64
                }}
              />
              <Dropdown menu={{ items: profileItems }} trigger={['click']} placement='bottomCenter'>
                <div className='flex items-center gap-2 cursor-pointer pr-4 hover:opacity-80 transition-opacity'>
                  <Avatar icon={<UserOutlined />} className='bg-[#1677ff]' />
                  <span className='font-medium'>Hồ sơ</span>
                </div>
              </Dropdown>
            </Header>
          </div>
          <Flex className='h-[calc(100vh-64px)] flex flex-col'>
            <Content className='py-[10px] px-[20px] overflow-y-auto'>
              <div>
                ERE – Biểu thức chính quy mở rộng Biểu thức chính quy mở rộng (ERE) là một dạng mở rộng của các biểu
                thức chính quy cơ bản. ERE cung cấp thêm các bộ định lượng (quantifier) bổ sung, không yêu cầu phải
                thoát (escape) một số ký tự đặc biệt (metacharacter) và tuân theo các quy tắc đặc biệt khác. Nếu ứng
                dụng của bạn hỗ trợ biểu thức chính quy mở rộng, hãy tham khảo tài liệu hướng dẫn sử dụng của hệ thống
                để nắm rõ cú pháp chính xác. Ứng dụng Regex Nguyên lý hoạt động của biểu thức chính quy (RegEx) là tìm
                kiếm và khớp các chuỗi dữ liệu dựa trên một mẫu (pattern) được xây dựng từ các quy tắc cơ bản. Để nắm
                vững cách sử dụng Regular Expression, bạn có thể thử nghiệm hàm preg_match trong PHP, kèm theo một vài
                ví dụ đơn giản nhằm thực hành trước khi khám phá các nội dung chuyên sâu hơn.ERE – Biểu thức chính quy
                mở rộng Biểu thức chính quy mở rộng (ERE) là một dạng mở rộng của các biểu thức chính quy cơ bản. ERE
                cung cấp thêm các bộ định lượng (quantifier) bổ sung, không yêu cầu phải thoát (escape) một số ký tự đặc
                biệt (metacharacter) và tuân theo các quy tắc đặc biệt khác. Nếu ứng dụng của bạn hỗ trợ biểu thức chính
                quy mở rộng, hãy tham khảo tài liệu hướng dẫn sử dụng của hệ thống để nắm rõ cú pháp chính xác. Ứng dụng
                Regex Nguyên lý hoạt động của biểu thức chính quy (RegEx) là tìm kiếm và khớp các chuỗi dữ liệu dựa trên
                một mẫu (pattern) được xây dựng từ các quy tắc cơ bản. Để nắm vững cách sử dụng Regular Expression, bạn
                có thể thử nghiệm hàm preg_match trong PHP, kèm theo một vài ví dụ đơn giản nhằm thực hành trước khi
                khám phá các nội dung chuyên sâu hơn.ERE – Biểu thức chính quy mở rộng Biểu thức chính quy mở rộng (ERE)
                là một dạng mở rộng của các biểu thức chính quy cơ bản. ERE cung cấp thêm các bộ định lượng (quantifier)
                bổ sung, không yêu cầu phải thoát (escape) một số ký tự đặc biệt (metacharacter) và tuân theo các quy
                tắc đặc biệt khác. Nếu ứng dụng của bạn hỗ trợ biểu thức chính quy mở rộng, hãy tham khảo tài liệu hướng
                dẫn sử dụng của hệ thống để nắm rõ cú pháp chính xác. Ứng dụng Regex Nguyên lý hoạt động của biểu thức
                chính quy (RegEx) là tìm kiếm và khớp các chuỗi dữ liệu dựa trên một mẫu (pattern) được xây dựng từ các
                quy tắc cơ bản. Để nắm vững cách sử dụng Regular Expression, bạn có thể thử nghiệm hàm preg_match trong
                PHP, kèm theo một vài ví dụ đơn giản nhằm thực hành trước khi khám phá các nội dung chuyên sâu hơn.ERE –
                Biểu thức chính quy mở rộng Biểu thức chính quy mở rộng (ERE) là một dạng mở rộng của các biểu thức
                chính quy cơ bản. ERE cung cấp thêm các bộ định lượng (quantifier) bổ sung, không yêu cầu phải thoát
                (escape) một số ký tự đặc biệt (metacharacter) và tuân theo các quy tắc đặc biệt khác. Nếu ứng dụng của
                bạn hỗ trợ biểu thức chính quy mở rộng, hãy tham khảo tài liệu hướng dẫn sử dụng của hệ thống để nắm rõ
                cú pháp chính xác. Ứng dụng Regex Nguyên lý hoạt động của biểu thức chính quy (RegEx) là tìm kiếm và
                khớp các chuỗi dữ liệu dựa trên một mẫu (pattern) được xây dựng từ các quy tắc cơ bản. Để nắm vững cách
                sử dụng Regular Expression, bạn có thể thử nghiệm hàm preg_match trong PHP, kèm theo một vài ví dụ đơn
                giản nhằm thực hành trước khi khám phá các nội dung chuyên sâu hơn.ERE – Biểu thức chính quy mở rộng
                Biểu thức chính quy mở rộng (ERE) là một dạng mở rộng của các biểu thức chính quy cơ bản. ERE cung cấp
                thêm các bộ định lượng (quantifier) bổ sung, không yêu cầu phải thoát (escape) một số ký tự đặc biệt
                (metacharacter) và tuân theo các quy tắc đặc biệt khác. Nếu ứng dụng của bạn hỗ trợ biểu thức chính quy
                mở rộng, hãy tham khảo tài liệu hướng dẫn sử dụng của hệ thống để nắm rõ cú pháp chính xác. Ứng dụng
                Regex Nguyên lý hoạt động của biểu thức chính quy (RegEx) là tìm kiếm và khớp các chuỗi dữ liệu dựa trên
                một mẫu (pattern) được xây dựng từ các quy tắc cơ bản. Để nắm vững cách sử dụng Regular Expression, bạn
                có thể thử nghiệm hàm preg_match trong PHP, kèm theo một vài ví dụ đơn giản nhằm thực hành trước khi
                khám phá các nội dung chuyên sâu hơn.ERE – Biểu thức chính quy mở rộng Biểu thức chính quy mở rộng (ERE)
                là một dạng mở rộng của các biểu thức chính quy cơ bản. ERE cung cấp thêm các bộ định lượng (quantifier)
                bổ sung, không yêu cầu phải thoát (escape) một số ký tự đặc biệt (metacharacter) và tuân theo các quy
                tắc đặc biệt khác. Nếu ứng dụng của bạn hỗ trợ biểu thức chính quy mở rộng, hãy tham khảo tài liệu hướng
                dẫn sử dụng của hệ thống để nắm rõ cú pháp chính xác. Ứng dụng Regex Nguyên lý hoạt động của biểu thức
                chính quy (RegEx) là tìm kiếm và khớp các chuỗi dữ liệu dựa trên một mẫu (pattern) được xây dựng từ các
                quy tắc cơ bản. Để nắm vững cách sử dụng Regular Expression, bạn có thể thử nghiệm hàm preg_match trong
                PHP, kèm theo một vài ví dụ đơn giản nhằm thực hành trước khi khám phá các nội dung chuyên sâu hơn.ERE –
                Biểu thức chính quy mở rộng Biểu thức chính quy mở rộng (ERE) là một dạng mở rộng của các biểu thức
                chính quy cơ bản. ERE cung cấp thêm các bộ định lượng (quantifier) bổ sung, không yêu cầu phải thoát
                (escape) một số ký tự đặc biệt (metacharacter) và tuân theo các quy tắc đặc biệt khác. Nếu ứng dụng của
                bạn hỗ trợ biểu thức chính quy mở rộng, hãy tham khảo tài liệu hướng dẫn sử dụng của hệ thống để nắm rõ
                cú pháp chính xác. Ứng dụng Regex Nguyên lý hoạt động của biểu thức chính quy (RegEx) là tìm kiếm và
                khớp các chuỗi dữ liệu dựa trên một mẫu (pattern) được xây dựng từ các quy tắc cơ bản. Để nắm vững cách
                sử dụng Regular Expression, bạn có thể thử nghiệm hàm preg_match trong PHP, kèm theo một vài ví dụ đơn
                giản nhằm thực hành trước khi khám phá các nội dung chuyên sâu hơn.ERE – Biểu thức chính quy mở rộng
                Biểu thức chính quy mở rộng (ERE) là một dạng mở rộng của các biểu thức chính quy cơ bản. ERE cung cấp
                thêm các bộ định lượng (quantifier) bổ sung, không yêu cầu phải thoát (escape) một số ký tự đặc biệt
                (metacharacter) và tuân theo các quy tắc đặc biệt khác. Nếu ứng dụng của bạn hỗ trợ biểu thức chính quy
                mở rộng, hãy tham khảo tài liệu hướng dẫn sử dụng của hệ thống để nắm rõ cú pháp chính xác. Ứng dụng
                Regex Nguyên lý hoạt động của biểu thức chính quy (RegEx) là tìm kiếm và khớp các chuỗi dữ liệu dựa trên
                một mẫu (pattern) được xây dựng từ các quy tắc cơ bản. Để nắm vững cách sử dụng Regular Expression, bạn
                có thể thử nghiệm hàm preg_match trong PHP, kèm theo một vài ví dụ đơn giản nhằm thực hành trước khi
                khám phá các nội dung chuyên sâu hơn.ERE – Biểu thức chính quy mở rộng Biểu thức chính quy mở rộng (ERE)
                là một dạng mở rộng của các biểu thức chính quy cơ bản. ERE cung cấp thêm các bộ định lượng (quantifier)
                bổ sung, không yêu cầu phải thoát (escape) một số ký tự đặc biệt (metacharacter) và tuân theo các quy
                tắc đặc biệt khác. Nếu ứng dụng của bạn hỗ trợ biểu thức chính quy mở rộng, hãy tham khảo tài liệu hướng
                dẫn sử dụng của hệ thống để nắm rõ cú pháp chính xác. Ứng dụng Regex Nguyên lý hoạt động của biểu thức
                chính quy (RegEx) là tìm kiếm và khớp các chuỗi dữ liệu dựa trên một mẫu (pattern) được xây dựng từ các
                quy tắc cơ bản. Để nắm vững cách sử dụng Regular Expression, bạn có thể thử nghiệm hàm preg_match trong
                PHP, kèm theo một vài ví dụ đơn giản nhằm thực hành trước khi khám phá các nội dung chuyên sâu hơn.ERE –
                Biểu thức chính quy mở rộng Biểu thức chính quy mở rộng (ERE) là một dạng mở rộng của các biểu thức
                chính quy cơ bản. ERE cung cấp thêm các bộ định lượng (quantifier) bổ sung, không yêu cầu phải thoát
                (escape) một số ký tự đặc biệt (metacharacter) và tuân theo các quy tắc đặc biệt khác. Nếu ứng dụng của
                bạn hỗ trợ biểu thức chính quy mở rộng, hãy tham khảo tài liệu hướng dẫn sử dụng của hệ thống để nắm rõ
                cú pháp chính xác. Ứng dụng Regex Nguyên lý hoạt động của biểu thức chính quy (RegEx) là tìm kiếm và
                khớp các chuỗi dữ liệu dựa trên một mẫu (pattern) được xây dựng từ các quy tắc cơ bản. Để nắm vững cách
                sử dụng Regular Expression, bạn có thể thử nghiệm hàm preg_match trong PHP, kèm theo một vài ví dụ đơn
                giản nhằm thực hành trước khi khám phá các nội dung chuyên sâu hơn.ERE – Biểu thức chính quy mở rộng
                Biểu thức chính quy mở rộng (ERE) là một dạng mở rộng của các biểu thức chính quy cơ bản. ERE cung cấp
                thêm các bộ định lượng (quantifier) bổ sung, không yêu cầu phải thoát (escape) một số ký tự đặc biệt
                (metacharacter) và tuân theo các quy tắc đặc biệt khác. Nếu ứng dụng của bạn hỗ trợ biểu thức chính quy
                mở rộng, hãy tham khảo tài liệu hướng dẫn sử dụng của hệ thống để nắm rõ cú pháp chính xác. Ứng dụng
                Regex Nguyên lý hoạt động của biểu thức chính quy (RegEx) là tìm kiếm và khớp các chuỗi dữ liệu dựa trên
                một mẫu (pattern) được xây dựng từ các quy tắc cơ bản. Để nắm vững cách sử dụng Regular Expression, bạn
                có thể thử nghiệm hàm preg_match trong PHP, kèm theo một vài ví dụ đơn giản nhằm thực hành trước khi
                khám phá các nội dung chuyên sâu hơn.ERE – Biểu thức chính quy mở rộng Biểu thức chính quy mở rộng (ERE)
                là một dạng mở rộng của các biểu thức chính quy cơ bản. ERE cung cấp thêm các bộ định lượng (quantifier)
                bổ sung, không yêu cầu phải thoát (escape) một số ký tự đặc biệt (metacharacter) và tuân theo các quy
                tắc đặc biệt khác. Nếu ứng dụng của bạn hỗ trợ biểu thức chính quy mở rộng, hãy tham khảo tài liệu hướng
                dẫn sử dụng của hệ thống để nắm rõ cú pháp chính xác. Ứng dụng Regex Nguyên lý hoạt động của biểu thức
                chính quy (RegEx) là tìm kiếm và khớp các chuỗi dữ liệu dựa trên một mẫu (pattern) được xây dựng từ các
                quy tắc cơ bản. Để nắm vững cách sử dụng Regular Expression, bạn có thể thử nghiệm hàm preg_match trong
                PHP, kèm theo một vài ví dụ đơn giản nhằm thực hành trước khi khám phá các nội dung chuyên sâu hơn.ERE –
                Biểu thức chính quy mở rộng Biểu thức chính quy mở rộng (ERE) là một dạng mở rộng của các biểu thức
                chính quy cơ bản. ERE cung cấp thêm các bộ định lượng (quantifier) bổ sung, không yêu cầu phải thoát
                (escape) một số ký tự đặc biệt (metacharacter) và tuân theo các quy tắc đặc biệt khác. Nếu ứng dụng của
                bạn hỗ trợ biểu thức chính quy mở rộng, hãy tham khảo tài liệu hướng dẫn sử dụng của hệ thống để nắm rõ
                cú pháp chính xác. Ứng dụng Regex Nguyên lý hoạt động của biểu thức chính quy (RegEx) là tìm kiếm và
                khớp các chuỗi dữ liệu dựa trên một mẫu (pattern) được xây dựng từ các quy tắc cơ bản. Để nắm vững cách
                sử dụng Regular Expression, bạn có thể thử nghiệm hàm preg_match trong PHP, kèm theo một vài ví dụ đơn
                giản nhằm thực hành trước khi khám phá các nội dung chuyên sâu hơn.ERE – Biểu thức chính quy mở rộng
                Biểu thức chính quy mở rộng (ERE) là một dạng mở rộng của các biểu thức chính quy cơ bản. ERE cung cấp
                thêm các bộ định lượng (quantifier) bổ sung, không yêu cầu phải thoát (escape) một số ký tự đặc biệt
                (metacharacter) và tuân theo các quy tắc đặc biệt khác. Nếu ứng dụng của bạn hỗ trợ biểu thức chính quy
                mở rộng, hãy tham khảo tài liệu hướng dẫn sử dụng của hệ thống để nắm rõ cú pháp chính xác. Ứng dụng
                Regex Nguyên lý hoạt động của biểu thức chính quy (RegEx) là tìm kiếm và khớp các chuỗi dữ liệu dựa trên
                một mẫu (pattern) được xây dựng từ các quy tắc cơ bản. Để nắm vững cách sử dụng Regular Expression, bạn
                có thể thử nghiệm hàm preg_match trong PHP, kèm theo một vài ví dụ đơn giản nhằm thực hành trước khi
                khám phá các nội dung chuyên sâu hơn.ERE – Biểu thức chính quy mở rộng Biểu thức chính quy mở rộng (ERE)
                là một dạng mở rộng của các biểu thức chính quy cơ bản. ERE cung cấp thêm các bộ định lượng (quantifier)
                bổ sung, không yêu cầu phải thoát (escape) một số ký tự đặc biệt (metacharacter) và tuân theo các quy
                tắc đặc biệt khác. Nếu ứng dụng của bạn hỗ trợ biểu thức chính quy mở rộng, hãy tham khảo tài liệu hướng
                dẫn sử dụng của hệ thống để nắm rõ cú pháp chính xác. Ứng dụng Regex Nguyên lý hoạt động của biểu thức
                chính quy (RegEx) là tìm kiếm và khớp các chuỗi dữ liệu dựa trên một mẫu (pattern) được xây dựng từ các
                quy tắc cơ bản. Để nắm vững cách sử dụng Regular Expression, bạn có thể thử nghiệm hàm preg_match trong
                PHP, kèm theo một vài ví dụ đơn giản nhằm thực hành trước khi khám phá các nội dung chuyên sâu hơn.ERE –
                Biểu thức chính quy mở rộng Biểu thức chính quy mở rộng (ERE) là một dạng mở rộng của các biểu thức
                chính quy cơ bản. ERE cung cấp thêm các bộ định lượng (quantifier) bổ sung, không yêu cầu phải thoát
                (escape) một số ký tự đặc biệt (metacharacter) và tuân theo các quy tắc đặc biệt khác. Nếu ứng dụng của
                bạn hỗ trợ biểu thức chính quy mở rộng, hãy tham khảo tài liệu hướng dẫn sử dụng của hệ thống để nắm rõ
                cú pháp chính xác. Ứng dụng Regex Nguyên lý hoạt động của biểu thức chính quy (RegEx) là tìm kiếm và
                khớp các chuỗi dữ liệu dựa trên một mẫu (pattern) được xây dựng từ các quy tắc cơ bản. Để nắm vững cách
                sử dụng Regular Expression, bạn có thể thử nghiệm hàm preg_match trong PHP, kèm theo một vài ví dụ đơn
                giản nhằm thực hành trước khi khám phá các nội dung chuyên sâu hơn.ERE – Biểu thức chính quy mở rộng
                Biểu thức chính quy mở rộng (ERE) là một dạng mở rộng của các biểu thức chính quy cơ bản. ERE cung cấp
                thêm các bộ định lượng (quantifier) bổ sung, không yêu cầu phải thoát (escape) một số ký tự đặc biệt
                (metacharacter) và tuân theo các quy tắc đặc biệt khác. Nếu ứng dụng của bạn hỗ trợ biểu thức chính quy
                mở rộng, hãy tham khảo tài liệu hướng dẫn sử dụng của hệ thống để nắm rõ cú pháp chính xác. Ứng dụng
                Regex Nguyên lý hoạt động của biểu thức chính quy (RegEx) là tìm kiếm và khớp các chuỗi dữ liệu dựa trên
                một mẫu (pattern) được xây dựng từ các quy tắc cơ bản. Để nắm vững cách sử dụng Regular Expression, bạn
                có thể thử nghiệm hàm preg_match trong PHP, kèm theo một vài ví dụ đơn giản nhằm thực hành trước khi
                khám phá các nội dung chuyên sâu hơn.ERE – Biểu thức chính quy mở rộng Biểu thức chính quy mở rộng (ERE)
                là một dạng mở rộng của các biểu thức chính quy cơ bản. ERE cung cấp thêm các bộ định lượng (quantifier)
                bổ sung, không yêu cầu phải thoát (escape) một số ký tự đặc biệt (metacharacter) và tuân theo các quy
                tắc đặc biệt khác. Nếu ứng dụng của bạn hỗ trợ biểu thức chính quy mở rộng, hãy tham khảo tài liệu hướng
                dẫn sử dụng của hệ thống để nắm rõ cú pháp chính xác. Ứng dụng Regex Nguyên lý hoạt động của biểu thức
                chính quy (RegEx) là tìm kiếm và khớp các chuỗi dữ liệu dựa trên một mẫu (pattern) được xây dựng từ các
                quy tắc cơ bản. Để nắm vững cách sử dụng Regular Expression, bạn có thể thử nghiệm hàm preg_match trong
                PHP, kèm theo một vài ví dụ đơn giản nhằm thực hành trước khi khám phá các nội dung chuyên sâu hơn.ERE –
                Biểu thức chính quy mở rộng Biểu thức chính quy mở rộng (ERE) là một dạng mở rộng của các biểu thức
                chính quy cơ bản. ERE cung cấp thêm các bộ định lượng (quantifier) bổ sung, không yêu cầu phải thoát
                (escape) một số ký tự đặc biệt (metacharacter) và tuân theo các quy tắc đặc biệt khác. Nếu ứng dụng của
                bạn hỗ trợ biểu thức chính quy mở rộng, hãy tham khảo tài liệu hướng dẫn sử dụng của hệ thống để nắm rõ
                cú pháp chính xác. Ứng dụng Regex Nguyên lý hoạt động của biểu thức chính quy (RegEx) là tìm kiếm và
                khớp các chuỗi dữ liệu dựa trên một mẫu (pattern) được xây dựng từ các quy tắc cơ bản. Để nắm vững cách
                sử dụng Regular Expression, bạn có thể thử nghiệm hàm preg_match trong PHP, kèm theo một vài ví dụ đơn
                giản nhằm thực hành trước khi khám phá các nội dung chuyên sâu hơn.
              </div>
            </Content>
          </Flex>
        </Layout>
      </Layout>
    </div>
  );
};

export default MainLayout;
