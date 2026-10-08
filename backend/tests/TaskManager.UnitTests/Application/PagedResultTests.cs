using TaskManager.Application.Common;

namespace TaskManager.UnitTests.Application;

public sealed class PagedResultTests
{
    [Theory]
    [InlineData(0, 1, 20, 0, false)]    // sin resultados
    [InlineData(20, 1, 20, 1, false)]   // una página exacta
    [InlineData(21, 1, 20, 2, true)]    // un elemento obliga a una segunda página
    [InlineData(21, 2, 20, 2, false)]   // última página
    [InlineData(20, 99, 20, 1, false)]  // página más allá de la última
    [InlineData(5, 1, 1, 5, true)]
    public void TotalPagesAndHasNextPage_AreDerivedFromTheTotal(
        int totalCount,
        int page,
        int pageSize,
        int expectedTotalPages,
        bool expectedHasNextPage)
    {
        var result = new PagedResult<int>([], page, pageSize, totalCount);

        Assert.Equal(expectedTotalPages, result.TotalPages);
        Assert.Equal(expectedHasNextPage, result.HasNextPage);
    }
}
